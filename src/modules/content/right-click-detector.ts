/**
 * 右ダブルクリック検出モジュール。
 * カウンターベースの状態管理で右ダブルクリックを判定し、
 * CLOSE_TAB メッセージをバックグラウンドに送信する。
 * コンテキストメニューは抑制しない（ユーザー体験を維持）。
 */

import {
  safeDocumentAddEventListener,
  safeDocumentRemoveEventListener,
  safeSetTimeout,
  safeClearTimeout,
} from '@/utils/safe-natives';
import { sendMessageToBackground, isContextValid } from '@/modules/messaging/sender';

const MIN_INTERVAL_MS = 20;

/**
 * Linux + Chromium では mouseup が contextmenu イベントの後に発火しない（Chromium bug #506801）。
 * この環境では mousedown で検出する必要がある。
 */
function detectLinuxChromium(): boolean {
  const ua = navigator.userAgent;
  return /Linux/.test(ua) && /Chrome\//.test(ua) && !/Edg\//.test(ua);
}

export class RightClickDetector {
  private clickCount = 0;
  private decrementTimerId: number | null = null;
  private lastEventTime = 0;
  private closeRequested = false;
  private enabled: boolean;
  private delay: number;
  private readonly useMouseDown: boolean;
  private readonly boundHandler: (e: MouseEvent) => void;

  constructor(enabled: boolean, delay: number) {
    this.enabled = enabled;
    this.delay = delay;
    this.useMouseDown = detectLinuxChromium();
    this.boundHandler = this.handleMouseEvent.bind(this);
  }

  attach(): void {
    const eventType = this.useMouseDown ? 'mousedown' : 'mouseup';
    safeDocumentAddEventListener(eventType, this.boundHandler, { capture: true });
  }

  detach(): void {
    const eventType = this.useMouseDown ? 'mousedown' : 'mouseup';
    safeDocumentRemoveEventListener(eventType, this.boundHandler, { capture: true });
    this.reset();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  private handleMouseEvent(e: MouseEvent): void {
    if (!this.enabled || e.button !== 2) return;

    if (!isContextValid()) {
      this.detach();
      return;
    }

    const now = Date.now();
    if (now - this.lastEventTime < MIN_INTERVAL_MS) return;
    this.lastEventTime = now;

    this.clickCount++;

    if (this.clickCount >= 2) {
      this.onDoubleRightClick();
      return;
    }

    if (this.decrementTimerId !== null) {
      safeClearTimeout(this.decrementTimerId);
    }
    this.decrementTimerId = safeSetTimeout(() => {
      this.clickCount = 0;
      this.decrementTimerId = null;
      this.closeRequested = false;
    }, this.delay) as unknown as number;
  }

  private onDoubleRightClick(): void {
    if (this.closeRequested) return;
    this.closeRequested = true;
    this.reset();

    sendMessageToBackground({ type: 'CLOSE_TAB' });
  }

  private reset(): void {
    this.clickCount = 0;
    if (this.decrementTimerId !== null) {
      safeClearTimeout(this.decrementTimerId);
      this.decrementTimerId = null;
    }
    this.closeRequested = false;
  }
}
