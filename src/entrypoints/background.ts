/**
 * バックグラウンドエントリポイント。
 * メッセージルーティング、onInstalled処理、
 * ストレージ変更監視、Keep-Aliveアラーム、
 * コンテンツスクリプト注入管理を統合する。
 */

import { getOptions } from '@/modules/options/storage';
import { DEFAULT_OPTIONS } from '@/modules/options/types';
import { parseBlacklist, isBlacklisted } from '@/modules/blacklist/matcher';
import { openNewTab } from '@/modules/tab/opener';
import { startKeepAlive, stopKeepAlive, isKeepAliveAlarm } from '@/modules/keep-alive/alarm';
import { sendMessageToTab, broadcastToTabs } from '@/modules/messaging/sender';
import type { ExtensionMessage, NewTabMessage, ContentScriptReadyMessage, CloseTabMessage } from '@/modules/messaging/types';

const ALL_PAGES_PATTERNS = ['http://*/*', 'https://*/*'];
const YOUTUBE_PATTERN = '*://*.youtube.com/*';

// タブ閉鎖デデュプリケーション（同一タブの短時間内重複閉鎖を防止）
const CLOSE_DEDUP_MS = 2500;
const recentlyClosedTabs = new Map<number, number>();

// 動的iframe再注入リトライ
const INJECTION_RETRY_INTERVAL_MS = 2500;
const INJECTION_RETRY_MAX = 20;
const injectionTimers = new Map<number, ReturnType<typeof setInterval>>();

export default defineBackground(() => {
  // --- ヘルパー: コンテンツスクリプト注入 ---
  async function injectContentScript(tabId: number): Promise<void> {
    try {
      await browser.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['/content-scripts/content.js'],
      });
      await browser.scripting.insertCSS({
        target: { tabId, allFrames: true },
        files: ['content-scripts/content.css'],
      });
    } catch {
      // 保護されたページでは失敗する（正常動作）
    }
  }

  // --- ヘルパー: iframe再注入リトライスケジューラ ---
  function scheduleIframeRetry(tabId: number): void {
    cancelIframeRetry(tabId);
    let remaining = INJECTION_RETRY_MAX;
    const timerId = setInterval(async () => {
      remaining--;
      if (remaining <= 0) {
        cancelIframeRetry(tabId);
        return;
      }
      try {
        const tab = await browser.tabs.get(tabId);
        if (tab?.status === 'complete') {
          await injectContentScript(tabId);
        }
      } catch {
        cancelIframeRetry(tabId);
      }
    }, INJECTION_RETRY_INTERVAL_MS);
    injectionTimers.set(tabId, timerId);
  }

  function cancelIframeRetry(tabId: number): void {
    const timerId = injectionTimers.get(tabId);
    if (timerId != null) {
      clearInterval(timerId);
      injectionTimers.delete(tabId);
    }
  }

  // --- グローバルエラーハンドラ ---
  self.addEventListener('error', (event) => {
    console.error('Smooth Tab [background error]:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
    });
  });
  self.addEventListener('unhandledrejection', (event) => {
    console.error('Smooth Tab [background unhandled rejection]:', { reason: event.reason });
  });

  // --- インストール・更新処理 ---
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      await browser.storage.local.set(DEFAULT_OPTIONS);
      browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
    }

    const tabs = await browser.tabs.query({ url: ALL_PAGES_PATTERNS });
    for (const tab of tabs) {
      if (tab.id == null) continue;
      await injectContentScript(tab.id);
    }
  });

  // --- タブ更新時の注入（動的iframe対応）---
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
      injectContentScript(tabId);
      scheduleIframeRetry(tabId);
    }
  });

  // --- BF Cache復元時の注入 ---
  browser.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
    cancelIframeRetry(removedTabId);
    injectContentScript(addedTabId);
  });

  // --- タブ閉鎖時のクリーンアップ ---
  browser.tabs.onRemoved.addListener((tabId) => {
    cancelIframeRetry(tabId);
    recentlyClosedTabs.delete(tabId);
  });

  // --- メッセージルーティング ---
  browser.runtime.onMessage.addListener(
    (msg: ExtensionMessage, sender: Browser.runtime.MessageSender) => {
      if (msg.type === 'NEW_TAB') {
        handleNewTabRequest(msg, sender);
      }

      if (msg.type === 'CLOSE_TAB') {
        handleCloseTabRequest(msg, sender);
      }

      if (msg.type === 'CONTENT_SCRIPT_READY') {
        handleContentScriptReady(sender);
      }
    },
  );

  async function handleNewTabRequest(
    msg: NewTabMessage,
    sender: Browser.runtime.MessageSender,
  ): Promise<void> {
    const options = await getOptions();
    await openNewTab(
      {
        url: msg.url,
        senderTabId: sender.tab?.id,
        senderTabIndex: sender.tab?.index,
      },
      options,
    );
  }

  async function handleCloseTabRequest(
    _msg: CloseTabMessage,
    sender: Browser.runtime.MessageSender,
  ): Promise<void> {
    const tabId = sender.tab?.id;
    if (tabId == null) return;

    // デデュプリケーション: 同一タブの短時間内重複閉鎖を防止
    const lastClosed = recentlyClosedTabs.get(tabId);
    if (lastClosed != null && Date.now() - lastClosed < CLOSE_DEDUP_MS) {
      return;
    }

    const options = await getOptions();
    if (options.protectPinnedTabs && sender.tab?.pinned) return;

    recentlyClosedTabs.set(tabId, Date.now());
    setTimeout(() => recentlyClosedTabs.delete(tabId), CLOSE_DEDUP_MS);

    try {
      await browser.tabs.remove(tabId);
    } catch {
      // タブが既に閉じられている場合は正常
    }
  }

  async function handleContentScriptReady(
    sender: Browser.runtime.MessageSender,
  ): Promise<void> {
    const options = await getOptions();
    const hostname = sender.url ? new URL(sender.url).hostname : '';
    const blacklistMap = parseBlacklist(options.blacklist);
    const blacklisted = isBlacklisted(hostname, blacklistMap);

    if (sender.tab?.id != null) {
      await sendMessageToTab(
        sender.tab.id,
        {
          type: 'INIT',
          payload: {
            blacklisted,
            delay: options.delay,
            enableYouTubeFix: options.enableYouTubeFix,
            enableRightDoubleClickClose: options.enableRightDoubleClickClose,
            rightDoubleClickDelay: options.rightDoubleClickDelay,
          },
        },
        sender.frameId,
      );
    }
  }

  // --- ストレージ変更監視 ---
  browser.storage.onChanged.addListener((changes) => {
    const generalPayload: Record<string, unknown> = {};

    if (changes.delay) {
      generalPayload.delay = changes.delay.newValue;
    }

    if (changes.rightDoubleClickDelay) {
      generalPayload.rightDoubleClickDelay = changes.rightDoubleClickDelay.newValue;
    }

    if (changes.blacklist) {
      (async () => {
        const options = await getOptions();
        const blacklistMap = parseBlacklist(options.blacklist);
        await broadcastToTabs(ALL_PAGES_PATTERNS, {
          type: 'OPTIONS_UPDATED',
          payload: { blacklist: blacklistMap },
        });
      })();
    }

    if (Object.keys(generalPayload).length > 0) {
      broadcastToTabs(ALL_PAGES_PATTERNS, {
        type: 'OPTIONS_UPDATED',
        payload: generalPayload as { delay?: number; rightDoubleClickDelay?: number },
      });
    }

    if (changes.enableYouTubeFix) {
      broadcastToTabs([YOUTUBE_PATTERN], {
        type: 'YOUTUBE_FIX_TOGGLED',
        payload: { enabled: Boolean(changes.enableYouTubeFix.newValue) },
      });
    }

    if (changes.enableRightDoubleClickClose) {
      broadcastToTabs(ALL_PAGES_PATTERNS, {
        type: 'RIGHT_CLICK_CLOSE_TOGGLED',
        payload: { enabled: Boolean(changes.enableRightDoubleClickClose.newValue) },
      });
    }

    if (changes.highPerformanceMode) {
      if (changes.highPerformanceMode.newValue) {
        startKeepAlive();
      } else {
        stopKeepAlive();
      }
    }
  });

  // --- ツールバーアイコンクリック（MV2: browserAction / MV3: action）---
  const actionApi = browser.action ?? (browser as any).browserAction;
  if (actionApi?.onClicked) {
    actionApi.onClicked.addListener(() => {
      browser.runtime.openOptionsPage();
    });
  }

  // --- Keep-Alive アラームリスナー ---
  browser.alarms.onAlarm.addListener((alarm) => {
    if (isKeepAliveAlarm(alarm)) {
      // イベントリスナー自体がサービスワーカーを延命する
    }
  });

  // --- 初期 Keep-Alive 状態設定 ---
  (async () => {
    const options = await getOptions();
    if (options.highPerformanceMode) {
      await startKeepAlive();
    } else {
      await stopKeepAlive();
    }
  })();
});
