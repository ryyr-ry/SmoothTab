/**
 * ネイティブブラウザ関数のキャッシュ。
 * ページスクリプトによるモンキーパッチから保護する。
 * コンテンツスクリプト専用。
 */

export const safeAddEventListener = window.addEventListener.bind(window);
export const safeRemoveEventListener = window.removeEventListener.bind(window);
export const safeDocumentDispatchEvent = document.dispatchEvent.bind(document);
export const safeDocumentAddEventListener = document.addEventListener.bind(document);
export const safeDocumentRemoveEventListener = document.removeEventListener.bind(document);
export const SafeCustomEvent = window.CustomEvent;
export const SafeMouseEvent = window.MouseEvent;
export const safeSetTimeout = window.setTimeout.bind(window);
export const safeClearTimeout = window.clearTimeout.bind(window);
