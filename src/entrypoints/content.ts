/**
 * コンテンツスクリプトエントリポイント。
 * 各モジュールを統合し、初期化・メッセージ受信・ティアダウンを管理する。
 */

import './content/style.css';
import { ClickHandler } from '@/modules/content/click-handler';
import { RightClickDetector } from '@/modules/content/right-click-detector';
import { AdapterRegistry } from '@/modules/site-adapters/adapter-registry';
import { isBlacklisted as checkBlacklisted, type BlacklistMap } from '@/modules/blacklist/matcher';
import { sendMessageToBackground } from '@/modules/messaging/sender';
import type { ExtensionMessage } from '@/modules/messaging/types';

const INSTANCE_KEY = '__smoothTabDestroy__' as const;

type GlobalWithDestroy = typeof globalThis & {
  [INSTANCE_KEY]?: () => void;
};

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  allFrames: true,

  main() {
    // 旧インスタンスを破棄する（isolated world 内で安全に管理）
    const global = globalThis as GlobalWithDestroy;
    global[INSTANCE_KEY]?.();

    const hostname = window.location.hostname;
    const adapterRegistry = new AdapterRegistry(hostname);
    // フェイルオープン: INIT 受信前も基本動作を許可（元の動作と同一）
    const guardState = { blacklisted: false };
    const clickHandler = new ClickHandler(adapterRegistry, guardState, 300);
    const rightClickDetector = new RightClickDetector(false, 500);

    clickHandler.attach();
    rightClickDetector.attach();

    // --- メッセージ受信 ---
    function handleMessage(
      message: ExtensionMessage,
      sender: Browser.runtime.MessageSender,
    ): void {
      if (sender.tab) return;

      switch (message.type) {
        case 'INIT':
          guardState.blacklisted = message.payload.blacklisted;
          clickHandler.setDelay(message.payload.delay);
          adapterRegistry.setYouTubeFixEnabled(message.payload.enableYouTubeFix);
          rightClickDetector.setEnabled(message.payload.enableRightDoubleClickClose);
          rightClickDetector.setDelay(message.payload.rightDoubleClickDelay);
          break;

        case 'OPTIONS_UPDATED':
          if (typeof message.payload.delay === 'number') {
            clickHandler.setDelay(message.payload.delay);
          }
          if (typeof message.payload.rightDoubleClickDelay === 'number') {
            rightClickDetector.setDelay(message.payload.rightDoubleClickDelay);
          }
          if (message.payload.blacklist) {
            const blacklistMap = message.payload.blacklist as BlacklistMap;
            guardState.blacklisted = checkBlacklisted(hostname, blacklistMap);
          }
          break;

        case 'YOUTUBE_FIX_TOGGLED':
          adapterRegistry.setYouTubeFixEnabled(message.payload.enabled);
          break;

        case 'RIGHT_CLICK_CLOSE_TOGGLED':
          rightClickDetector.setEnabled(message.payload.enabled);
          break;
      }
    }

    browser.runtime.onMessage.addListener(handleMessage);

    // --- ティアダウン ---
    function destroy(): void {
      clickHandler.detach();
      rightClickDetector.detach();
      browser.runtime.onMessage.removeListener(handleMessage);
      delete global[INSTANCE_KEY];
    }

    global[INSTANCE_KEY] = destroy;

    window.addEventListener('beforeunload', () => {
      clickHandler.detach();
      rightClickDetector.detach();
    });

    // --- 初期化完了を通知（指数バックオフリトライ）---
    void (async () => {
      const MAX_RETRIES = 3;
      const BASE_DELAY_MS = 500;
      let attempt = 0;

      while (attempt <= MAX_RETRIES) {
        const ok = await sendMessageToBackground({ type: 'CONTENT_SCRIPT_READY' });
        if (ok) break;
        attempt++;
        if (attempt > MAX_RETRIES) break;
        await new Promise((r) => setTimeout(r, BASE_DELAY_MS * Math.pow(2, attempt - 1)));
      }
    })();
  },
});
