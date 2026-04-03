/**
 * リンク解決モジュール。
 * クリックイベントからアンカー要素を探索する。
 * Shadow DOM のcomposedPathも探索対象とする。
 */

export function resolveAnchor(event: MouseEvent): HTMLAnchorElement | null {
  const target = event.target as Element | null;
  if (!target) return null;

  const closest = target.closest('a');
  if (closest instanceof HTMLAnchorElement && closest.href) return closest;

  const path = event.composedPath();
  for (const element of path) {
    if (element instanceof HTMLAnchorElement && element.href) {
      return element;
    }
  }

  return null;
}
