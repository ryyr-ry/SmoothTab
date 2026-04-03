/**
 * ウェルカムページの TypeScript エントリポイント。
 * i18n のローカライズと、ダブルクリック機能のデモを担当する。
 * 拡張ページではコンテンツスクリプトが注入されないため、
 * 元の実装と同じくページ内で直接 ClickHandler を初期化する。
 */

import '../../styles/theme.css';
import './style.css';
import '../content/style.css';
import { ClickHandler } from '@/modules/content/click-handler';
import { AdapterRegistry } from '@/modules/site-adapters/adapter-registry';
import { sendMessageToBackground } from '@/modules/messaging/sender';

type I18nKey = Parameters<typeof browser.i18n.getMessage>[0];

document.documentElement.lang = browser.i18n.getUILanguage();

document.querySelectorAll<HTMLElement>('[i18n]').forEach((el) => {
  const key = el.getAttribute('i18n') as I18nKey | null;
  if (key) {
    const message = browser.i18n.getMessage(key);
    if (message) el.textContent = message;
  }
});

document.title = browser.i18n.getMessage('thankHeader');

// --- ダブルクリック機能の初期化 ---
const adapterRegistry = new AdapterRegistry(window.location.hostname);
const guardState = { blacklisted: false };
const clickHandler = new ClickHandler(adapterRegistry, guardState, 300);
clickHandler.attach();

void sendMessageToBackground({ type: 'CONTENT_SCRIPT_READY' });
