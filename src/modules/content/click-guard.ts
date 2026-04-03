/**
 * クリックガード条件判定モジュール。
 * クリックイベントが処理対象かどうかを判定する。
 */

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'blob:', 'file:'];

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

  // 同一ページ内アンカー（#, #section）
  try {
    const url = new URL(anchor.href, document.baseURI);
    if (url.origin === location.origin && url.pathname === location.pathname && url.hash && !url.search) {
      return true;
    }
  } catch {
    return true;
  }

  // 危険なプロトコル
  for (const proto of DANGEROUS_PROTOCOLS) {
    if (anchor.href.startsWith(proto)) return true;
  }

  // target="_blank" は既にブラウザが新タブで開く
  if (anchor.target === '_blank') return true;

  // Google 画像検索の特殊リンク
  if (anchor.href.includes('/imgres?')) return true;

  return false;
}
