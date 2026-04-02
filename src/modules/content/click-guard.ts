/**
 * クリックガード条件判定モジュール。
 * クリックイベントが処理対象かどうかを判定する。
 */

export interface ClickGuardState {
  blacklisted: boolean;
}

export function shouldIgnoreClick(event: MouseEvent, state: ClickGuardState): boolean {
  if (!event.isTrusted) return true;
  if (state.blacklisted) return true;
  if (event.ctrlKey || event.shiftKey || event.metaKey || event.altKey) return true;
  if (event.button !== 0) return true;
  return false;
}

export function shouldIgnoreAnchor(anchor: HTMLAnchorElement): boolean {
  if (!anchor.href) return true;
  if (anchor.href.includes('/imgres?')) return true;
  return false;
}
