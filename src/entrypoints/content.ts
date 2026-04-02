/**
 * コンテンツスクリプトエントリポイント。
 * 各モジュールを統合し、初期化・メッセージ受信・ティアダウンを管理する。
 */

import './content/style.css';
import { ClickHandler } from '@/modules/content/click-handler';
import { AdapterRegistry } from '@/modules/site-adapters/adapter-registry';
import { isBlacklisted as checkBlacklisted, type BlacklistMap } from '@/modules/blacklist/matcher';
import { sendMessageToBackground } from '@/modules/messaging/sender';
import {
  safeDocumentDispatchEvent,
  safeDocumentAddEventListener,
  safeDocumentRemoveEventListener,
  SafeCustomEvent,
} from '@/utils/safe-natives';
import type { ExtensionMessage } from '@/modules/messaging/types';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  allFrames: true,

  main() {
    const TEARDOWN_EVENT = `smooth-tab-teardown-${browser.runtime.id}`;

    // 旧インスタンスを破棄する
    safeDocumentDispatchEvent(new SafeCustomEvent(TEARDOWN_EVENT));

    const hostname = window.location.hostname;
    const adapterRegistry = new AdapterRegistry(hostname);
    const guardState = { blacklisted: false };
    const clickHandler = new ClickHandler(adapterRegistry, guardState, 300);

    clickHandler.attach();

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
          break;

        case 'OPTIONS_UPDATED':
          if (typeof message.payload.delay === 'number') {
            clickHandler.setDelay(message.payload.delay);
          }
          if (message.payload.blacklist) {
            const blacklistMap = message.payload.blacklist as BlacklistMap;
            guardState.blacklisted = checkBlacklisted(hostname, blacklistMap);
          }
          break;

        case 'YOUTUBE_FIX_TOGGLED':
          adapterRegistry.setYouTubeFixEnabled(message.payload.enabled);
          break;
      }
    }

    browser.runtime.onMessage.addListener(handleMessage);

    // --- ティアダウン ---
    function destroy(): void {
      safeDocumentRemoveEventListener(TEARDOWN_EVENT, destroy);
      clickHandler.detach();
      browser.runtime.onMessage.removeListener(handleMessage);
    }

    safeDocumentAddEventListener(TEARDOWN_EVENT, destroy);

    window.addEventListener('beforeunload', () => {
      clickHandler.detach();
    });

    // --- 初期化完了を通知 ---
    sendMessageToBackground({ type: 'CONTENT_SCRIPT_READY' });
  },
});
