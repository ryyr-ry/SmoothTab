/**
 * バックグラウンドエントリポイント。
 * メッセージルーティング、onInstalled処理、
 * ストレージ変更監視、Keep-Aliveアラームを統合する。
 */

import { getOptions } from '@/modules/options/storage';
import { DEFAULT_OPTIONS } from '@/modules/options/types';
import { parseBlacklist, isBlacklisted } from '@/modules/blacklist/matcher';
import { openNewTab } from '@/modules/tab/opener';
import { startKeepAlive, stopKeepAlive, isKeepAliveAlarm } from '@/modules/keep-alive/alarm';
import { sendMessageToTab, broadcastToTabs } from '@/modules/messaging/sender';
import type { ExtensionMessage, NewTabMessage, ContentScriptReadyMessage } from '@/modules/messaging/types';

const ALL_PAGES_PATTERNS = ['http://*/*', 'https://*/*', 'file://*/*'];
const YOUTUBE_PATTERN = '*://*.youtube.com/*';

export default defineBackground(() => {
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
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          files: ['/content-scripts/content.js'],
        });
        await browser.scripting.insertCSS({
          target: { tabId: tab.id, allFrames: true },
          files: ['/content-scripts/content.css'],
        });
      } catch {
        // 保護されたページでは失敗する（正常動作）
      }
    }
  });

  // --- メッセージルーティング ---
  browser.runtime.onMessage.addListener(
    (msg: ExtensionMessage, sender: Browser.runtime.MessageSender) => {
      if (msg.type === 'NEW_TAB') {
        handleNewTabRequest(msg, sender);
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
        payload: generalPayload as { delay?: number },
      });
    }

    if (changes.enableYouTubeFix) {
      broadcastToTabs([YOUTUBE_PATTERN], {
        type: 'YOUTUBE_FIX_TOGGLED',
        payload: { enabled: Boolean(changes.enableYouTubeFix.newValue) },
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
