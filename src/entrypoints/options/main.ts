/**
 * オプションページの TypeScript エントリポイント。
 * 設定の読み込み・保存、バリデーション、
 * ダブルクリックテスト、i18n を担当する。
 */

import '../../styles/theme.css';
import './style.css';
import { DEFAULT_OPTIONS, DELAY_MIN, DELAY_MAX, RIGHT_CLICK_DELAY_MIN, RIGHT_CLICK_DELAY_MAX } from '@/modules/options/types';
import { saveOption } from '@/modules/options/storage';

const DEBOUNCE_MS = 400;
const TEST_RESET_MS = 3000;

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = browser.i18n.getUILanguage();

  // フォーム送信を JS で防止（inline handler を排除）
  const form = document.getElementById('options-form');
  if (form) {
    form.addEventListener('submit', (e) => e.preventDefault());
  }

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
    enableRightDoubleClickClose: document.getElementById('enableRightDoubleClickClose') as HTMLInputElement,
    protectPinnedTabs: document.getElementById('protectPinnedTabs') as HTMLInputElement,
    rightDoubleClickDelay: document.getElementById('rightDoubleClickDelay') as HTMLInputElement,
    rightClickTestStatus: document.getElementById('right-click-test-status') as HTMLSpanElement,
  };

  // i18n のベーステキストをキャッシュ（ミリ秒付加時に復元するため）
  const dblClickBaseText = browser.i18n.getMessage('dblclick') || 'Double-click detected';
  const rightClickDetectedText = browser.i18n.getMessage('rightClickTestDetected') || 'Detected';
  const rightClickWaitingText = browser.i18n.getMessage('rightClickTestWaiting') || 'Waiting';

  // --- 設定を読み込んで表示 ---
  browser.storage.local.get(DEFAULT_OPTIONS).then((options) => {
    elements.openTabFront.checked = Boolean(options.openTabFront);
    elements.openTabEnd.checked = Boolean(options.openTabEnd);
    elements.enableYouTubeFix.checked = Boolean(options.enableYouTubeFix);
    elements.highPerformanceMode.checked = Boolean(options.highPerformanceMode);
    elements.delay.value = String(options.delay);
    elements.blacklist.value = String(options.blacklist);
    elements.enableRightDoubleClickClose.checked = Boolean(options.enableRightDoubleClickClose);
    elements.protectPinnedTabs.checked = Boolean(options.protectPinnedTabs);
    elements.rightDoubleClickDelay.value = String(options.rightDoubleClickDelay);
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
  elements.enableRightDoubleClickClose.addEventListener('change', () => {
    saveOption('enableRightDoubleClickClose', elements.enableRightDoubleClickClose.checked);
  });
  elements.protectPinnedTabs.addEventListener('change', () => {
    saveOption('protectPinnedTabs', elements.protectPinnedTabs.checked);
  });

  // --- 左クリック遅延入力のバリデーション ---
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

  // --- 右クリック遅延入力のバリデーション ---
  elements.rightDoubleClickDelay.addEventListener('input', () => {
    elements.rightDoubleClickDelay.value = elements.rightDoubleClickDelay.value.replace(/[^0-9]/g, '');
    const parsed = parseInt(elements.rightDoubleClickDelay.value, 10);
    if (parsed > RIGHT_CLICK_DELAY_MAX) {
      elements.rightDoubleClickDelay.value = String(RIGHT_CLICK_DELAY_MAX);
    }
  });
  elements.rightDoubleClickDelay.addEventListener('change', () => {
    let value = parseInt(elements.rightDoubleClickDelay.value, 10);
    if (isNaN(value) || value < RIGHT_CLICK_DELAY_MIN || value > RIGHT_CLICK_DELAY_MAX) {
      value = DEFAULT_OPTIONS.rightDoubleClickDelay;
      elements.rightDoubleClickDelay.value = String(value);
    }
    saveOption('rightDoubleClickDelay', value);
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

  // --- 左ダブルクリックテスト（ミリ秒表示付き）---
  let clickTimer: ReturnType<typeof setTimeout> | null = null;
  let firstClickTime = 0;
  elements.clickMe.addEventListener('click', () => {
    elements.singleClickStatus.style.opacity = '0.6';
    elements.dblClickStatus.style.opacity = '0.6';

    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      const intervalMs = Date.now() - firstClickTime;
      elements.dblClickStatus.textContent = `${dblClickBaseText} (${intervalMs}ms)`;
      elements.dblClickStatus.style.opacity = '1';
    } else {
      firstClickTime = Date.now();
      const currentDelay = parseInt(elements.delay.value, 10) || DEFAULT_OPTIONS.delay;
      clickTimer = setTimeout(() => {
        clickTimer = null;
        elements.singleClickStatus.style.opacity = '1';
      }, currentDelay);
    }
  });

  // --- 右ダブルクリックテスト（ページ全体で検出、ミリ秒表示付き）---
  let rightClickCount = 0;
  let rightClickDecrementTimer: ReturnType<typeof setTimeout> | null = null;
  let rightFirstClickTime = 0;
  let rightTestResetTimer: ReturnType<typeof setTimeout> | null = null;
  const MIN_RIGHT_CLICK_INTERVAL_MS = 50;
  let lastRightClickTime = 0;

  document.addEventListener('contextmenu', (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastRightClickTime < MIN_RIGHT_CLICK_INTERVAL_MS) return;
    lastRightClickTime = now;

    rightClickCount++;

    if (rightClickCount === 1) {
      rightFirstClickTime = now;
    }

    if (rightClickCount >= 2) {
      const intervalMs = now - rightFirstClickTime;
      elements.rightClickTestStatus.textContent = `✓ ${rightClickDetectedText} (${intervalMs}ms)`;
      elements.rightClickTestStatus.classList.add('detected');

      rightClickCount = 0;
      if (rightClickDecrementTimer !== null) {
        clearTimeout(rightClickDecrementTimer);
        rightClickDecrementTimer = null;
      }

      if (rightTestResetTimer !== null) {
        clearTimeout(rightTestResetTimer);
      }
      rightTestResetTimer = setTimeout(() => {
        elements.rightClickTestStatus.textContent = rightClickWaitingText;
        elements.rightClickTestStatus.classList.remove('detected');
        rightTestResetTimer = null;
      }, TEST_RESET_MS);
      return;
    }

    if (rightClickDecrementTimer !== null) {
      clearTimeout(rightClickDecrementTimer);
    }
    const currentRightDelay = parseInt(elements.rightDoubleClickDelay.value, 10) || DEFAULT_OPTIONS.rightDoubleClickDelay;
    rightClickDecrementTimer = setTimeout(() => {
      rightClickCount = 0;
      rightClickDecrementTimer = null;
    }, currentRightDelay);
  }, { capture: true });

  // --- i18n ---
  type I18nKey = Parameters<typeof browser.i18n.getMessage>[0];
  document.querySelectorAll<HTMLElement>('[i18n]').forEach((el) => {
    const key = el.getAttribute('i18n') as I18nKey | null;
    if (key) {
      const message = browser.i18n.getMessage(key);
      if (message) el.textContent = message;
    }
  });
  document.title = browser.i18n.getMessage('optionsTitle');
});
