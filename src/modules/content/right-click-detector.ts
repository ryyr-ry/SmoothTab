/**
 * 右ダブルクリック検出モジュール。
 * contextmenu イベントのタイムスタンプ比較で右ダブルクリックを判定し、
 * CLOSE_TAB メッセージをバックグラウンドに送信する。
 * コンテキストメニューは抑制しない（ユーザー体験を維持）。
 *
 * contextmenu を使用する理由:
 * - 右クリックの正規イベントであり全プラットフォームで安定して発火する
 * - mouseup と異なり Linux Chrome のバグ（#506801）の影響を受けない
 * - コンテキストメニュー表示中の再右クリックでも確実に発火する
 */

import {
  safeDocumentAddEventListener,
  safeDocumentRemoveEventListener,
} from '@/utils/safe-natives';
import { sendMessageToBackground, isContextValid } from '@/modules/messaging/sender';

export class RightClickDetector {
  private lastContextMenuTime = 0;
  private enabled: boolean;
  private delay: number;
  private readonly boundHandler: (e: MouseEvent) => void;

  constructor(enabled: boolean, delay: number) {
    this.enabled = enabled;
    this.delay = delay;
    this.boundHandler = this.handleContextMenu.bind(this);
  }

  attach(): void {
    safeDocumentAddEventListener('contextmenu', this.boundHandler, { capture: true });
  }

  detach(): void {
    safeDocumentRemoveEventListener('contextmenu', this.boundHandler, { capture: true });
    this.lastContextMenuTime = 0;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.lastContextMenuTime = 0;
    }
  }

  setDelay(delay: number): void {
    this.delay = delay;
  }

  private handleContextMenu(_e: MouseEvent): void {
    if (!this.enabled) return;

    if (!isContextValid()) {
      this.detach();
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastContextMenuTime;
    this.lastContextMenuTime = now;

    // タイムスタンプ比較: 前回からの経過時間が delay 以内なら右ダブルクリック
    if (elapsed > 0 && elapsed <= this.delay) {
      this.lastContextMenuTime = 0;
      sendMessageToBackground({ type: 'CLOSE_TAB' });
    }
  }
}
