/**
 * オプションページの TypeScript エントリポイント。
 * 設定の読み込み・保存、バリデーション、
 * ダブルクリックテスト、i18n を担当する。
 */

import '../../styles/theme.css';
import './style.css';
import { DEFAULT_OPTIONS, DELAY_MIN, DELAY_MAX } from '@/modules/options/types';
import { saveOption } from '@/modules/options/storage';

const DEBOUNCE_MS = 400;

document.addEventListener('DOMContentLoaded', () => {
  const elements = {
    openTabFront: document.getElementById('openTabFront') as HTMLInputElement,
    openTabEnd: document.getElementById('openTabEnd') as HTMLInputElement,
    enableYouTubeFix: document.getElementById('enableYouTubeFix') as HTMLInputElement,
    highPerformanceMode: document.getElementById('highPerformanceMode') as HTMLInputElement,
    delay: document.getElementById('delay') as HTMLInputElement,
    blacklist: document.getElementById('blacklist') as HTMLTextAreaElement,
    clickMe: document.getElementById('clickme') as HTMLSpanElement,
    singleClickStatus: document.getElementById('singleclick-status') as HTMLSpanElement,
    dblClickStatus: document.getElementById('dblclick-status') as HTMLSpanElement,
  };

  // --- 設定を読み込んで表示 ---
  browser.storage.local.get(DEFAULT_OPTIONS).then((options) => {
    elements.openTabFront.checked = Boolean(options.openTabFront);
    elements.openTabEnd.checked = Boolean(options.openTabEnd);
    elements.enableYouTubeFix.checked = Boolean(options.enableYouTubeFix);
    elements.highPerformanceMode.checked = Boolean(options.highPerformanceMode);
    elements.delay.value = String(options.delay);
    elements.blacklist.value = String(options.blacklist);
  });

  // --- トグルスイッチのイベントリスナー ---
  elements.openTabFront.addEventListener('change', () => {
    saveOption('openTabFront', elements.openTabFront.checked);
  });
  elements.openTabEnd.addEventListener('change', () => {
    saveOption('openTabEnd', elements.openTabEnd.checked);
  });
  elements.enableYouTubeFix.addEventListener('change', () => {
    saveOption('enableYouTubeFix', elements.enableYouTubeFix.checked);
  });
  elements.highPerformanceMode.addEventListener('change', () => {
    saveOption('highPerformanceMode', elements.highPerformanceMode.checked);
  });

  // --- 遅延入力のバリデーション ---
  elements.delay.addEventListener('input', () => {
    elements.delay.value = elements.delay.value.replace(/[^0-9]/g, '');
    const parsed = parseInt(elements.delay.value, 10);
    if (parsed > DELAY_MAX) {
      elements.delay.value = String(DELAY_MAX);
    }
  });
  elements.delay.addEventListener('change', () => {
    let value = parseInt(elements.delay.value, 10);
    if (isNaN(value) || value < DELAY_MIN || value > DELAY_MAX) {
      value = DEFAULT_OPTIONS.delay;
      elements.delay.value = String(value);
    }
    saveOption('delay', value);
  });

  // --- ブラックリストのデバウンス付き保存 ---
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  elements.blacklist.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const sanitized = elements.blacklist.value
        .split('\n')
        .map((line) => {
          let domain = line.trim().replace(/^https?:\/\//, '').replace(/^\*\.?/, '');
          const slashIndex = domain.indexOf('/');
          if (slashIndex > 0) domain = domain.slice(0, slashIndex);
          return domain;
        })
        .filter(Boolean)
        .join('\n');

      if (elements.blacklist.value !== sanitized) {
        elements.blacklist.value = sanitized;
      }
      saveOption('blacklist', sanitized);
    }, DEBOUNCE_MS);
  });

  // --- ダブルクリックテスト ---
  let clickTimer: ReturnType<typeof setTimeout> | null = null;
  elements.clickMe.addEventListener('click', () => {
    elements.singleClickStatus.style.opacity = '0.6';
    elements.dblClickStatus.style.opacity = '0.6';

    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      elements.dblClickStatus.style.opacity = '1';
    } else {
      const currentDelay = parseInt(elements.delay.value, 10) || DEFAULT_OPTIONS.delay;
      clickTimer = setTimeout(() => {
        clickTimer = null;
        elements.singleClickStatus.style.opacity = '1';
      }, currentDelay);
    }
  });

  // --- i18n ---
  document.querySelectorAll<HTMLElement>('[i18n]').forEach((el) => {
    const key = el.getAttribute('i18n');
    if (key) {
      const message = browser.i18n.getMessage(key);
      if (message) el.textContent = message;
    }
  });
  document.title = browser.i18n.getMessage('optionsTitle');
});
