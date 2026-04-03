/**
 * ネイティブブラウザ関数のキャッシュ。
 * ページスクリプトによるモンキーパッチから保護する。
 * コンテンツスクリプト専用。
 */

// window/document に束縛済みのメソッド
export const safeAddEventListener = window.addEventListener.bind(window);
export const safeRemoveEventListener = window.removeEventListener.bind(window);
export const safeDocumentAddEventListener = document.addEventListener.bind(document);
export const safeDocumentRemoveEventListener = document.removeEventListener.bind(document);

// 任意の EventTarget に .call() で使うための非束縛プロトタイプメソッド
export const safeEventTargetAddEventListener = EventTarget.prototype.addEventListener;
export const safeEventTargetDispatchEvent = EventTarget.prototype.dispatchEvent;

export const SafeMouseEvent = window.MouseEvent;
export const safeSetTimeout = window.setTimeout.bind(window);
export const safeClearTimeout = window.clearTimeout.bind(window);
