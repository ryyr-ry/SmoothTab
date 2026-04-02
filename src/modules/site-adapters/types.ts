/**
 * SiteAdapter インターフェース定義。
 * サイト固有の振る舞いを抽象化し、コアのクリックハンドラから分離する。
 */

export interface SiteAdapter {
  /**
   * シングルクリック再現時にカスタム動作が必要か判定する。
   * true の場合、replayClick が呼ばれる。false の場合、デフォルトの anchor.click() が使われる。
   */
  needsCustomReplay(anchor: HTMLAnchorElement): boolean;

  /**
   * カスタムシングルクリックを再現する。
   * needsCustomReplay が true を返した場合のみ呼ばれる。
   */
  replayClick(target: EventTarget, originalEvent: MouseEvent): void;

  /**
   * アニメーション対象要素を選定する。
   * デフォルトではアンカー自体を返す。
   */
  resolveAnimationTarget(event: MouseEvent, anchor: HTMLAnchorElement): HTMLElement;

  /**
   * クリック待機中にイベントシールドが必要か判定する。
   */
  needsEventShield(anchor: HTMLAnchorElement): boolean;
}
