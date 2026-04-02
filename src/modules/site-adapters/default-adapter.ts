/**
 * デフォルトサイトアダプタ。
 * 全サイト共通のデフォルト動作を提供する。
 */

import type { SiteAdapter } from './types';

export class DefaultAdapter implements SiteAdapter {
  needsCustomReplay(_anchor: HTMLAnchorElement): boolean {
    return false;
  }

  replayClick(_target: EventTarget, _originalEvent: MouseEvent): void {
    // デフォルトでは何もしない。コアが anchor.click() を使う。
  }

  resolveAnimationTarget(_event: MouseEvent, anchor: HTMLAnchorElement): HTMLElement {
    return anchor;
  }

  needsEventShield(_anchor: HTMLAnchorElement): boolean {
    return false;
  }
}
