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
import { getOptions } from '@/modules/options/storage';
import { DEFAULT_OPTIONS } from '@/modules/options/types';

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

// --- ダブルクリック機能の初期化（ストレージからdelay読み込み）---
void (async () => {
  let delay = DEFAULT_OPTIONS.delay;
  try {
    const options = await getOptions();
    delay = options.delay;
  } catch {
    // 初回インストール直後はストレージが空の可能性あり
  }

  const adapterRegistry = new AdapterRegistry(window.location.hostname);
  const guardState = { blacklisted: false };
  const clickHandler = new ClickHandler(adapterRegistry, guardState, delay);
  clickHandler.attach();
})();
