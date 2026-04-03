/**
 * ダブルクリック検出モジュール。
 * タイマーベースの状態管理でダブルクリックを判定する。
 */

import { safeSetTimeout, safeClearTimeout } from '@/utils/safe-natives';

export type DoubleClickResult =
  | { kind: 'first-click' }
  | { kind: 'double-click' }
  | { kind: 'different-link' };

export class DoubleClickDetector {
  private pendingTimerId: number | null = null;
  private lastAnchor: HTMLAnchorElement | null = null;
  private lastEvent: MouseEvent | null = null;
  private delay: number;

  constructor(delay: number) {
    this.delay = delay;
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  detect(anchor: HTMLAnchorElement): DoubleClickResult {
    if (this.pendingTimerId !== null) {
      if (this.lastAnchor?.isSameNode(anchor)) {
        this.clearPending();
        return { kind: 'double-click' };
      }
      this.clearPending();
      return { kind: 'different-link' };
    }
    return { kind: 'first-click' };
  }

  /**
   * シングルクリック遅延再実行をスケジュールする。
   * タイムアウト後に onSingleClick コールバックが呼ばれる。
   */
  scheduleSingleClick(
    anchor: HTMLAnchorElement,
    event: MouseEvent,
    onSingleClick: (anchor: HTMLAnchorElement, event: MouseEvent) => void,
  ): void {
    this.lastAnchor = anchor;
    this.lastEvent = event;
    this.pendingTimerId = safeSetTimeout(() => {
      const savedAnchor = this.lastAnchor;
      const savedEvent = this.lastEvent;
      this.clearPending();
      if (savedAnchor?.isConnected && savedEvent) {
        onSingleClick(savedAnchor, savedEvent);
      }
    }, this.delay);
  }

  clearPending(): void {
    if (this.pendingTimerId !== null) {
      safeClearTimeout(this.pendingTimerId);
      this.pendingTimerId = null;
    }
    this.lastAnchor = null;
    this.lastEvent = null;
  }

  hasPending(): boolean {
    return this.pendingTimerId !== null;
  }

  getLastAnchor(): HTMLAnchorElement | null {
    return this.lastAnchor;
  }
}
