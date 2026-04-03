/**
 * クリックガード条件判定モジュール。
 * クリックイベントが処理対象かどうかを判定する。
 */

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'blob:', 'file:'];
const NON_NAVIGABLE_PROTOCOLS = ['mailto:', 'tel:', 'ftp:'];

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

  // download属性つきリンクはブラウザのダウンロード機能に委ねる
  if (anchor.hasAttribute('download')) return true;

  // 同一ページ内アンカー（#, #section）
  try {
    const url = new URL(anchor.href, document.baseURI);
    const isSamePage = url.origin === location.origin && url.pathname === location.pathname;
    // 「#」のみ（url.hash === ""）も、hash付き（url.hash === "#section"）も対象
    if (isSamePage && !url.search && (url.hash || anchor.getAttribute('href')?.startsWith('#'))) {
      return true;
    }
  } catch {
    // URL解析失敗時はhashチェックをスキップし、後続の判定に進む
  }

  // 危険なプロトコル（実行系）
  for (const proto of DANGEROUS_PROTOCOLS) {
    if (anchor.href.startsWith(proto)) return true;
  }

  // ナビゲーション不可能なプロトコル（新タブで開けない）
  for (const proto of NON_NAVIGABLE_PROTOCOLS) {
    if (anchor.href.startsWith(proto)) return true;
  }

  // Google 画像検索の特殊リンク
  if (anchor.href.includes('/imgres?')) return true;

  return false;
}
