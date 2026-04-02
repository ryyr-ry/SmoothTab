/**
 * ウェルカムページの TypeScript エントリポイント。
 * i18n のローカライズのみを担当する。
 */

import '../../styles/theme.css';
import './style.css';

document.querySelectorAll<HTMLElement>('[i18n]').forEach((el) => {
  const key = el.getAttribute('i18n');
  if (key) {
    const message = browser.i18n.getMessage(key);
    if (message) el.textContent = message;
  }
});

document.title = browser.i18n.getMessage('thankHeader');
