/**
 * 汎用イベントシールドモジュール。
 * マウスムーブ系イベントを一時的にブロックし、
 * サイトアダプタが必要とする場合に展開/収納する。
 */

import {
  safeAddEventListener,
  safeRemoveEventListener,
} from '@/utils/safe-natives';

const SHIELDED_EVENTS = [
  'mousemove',
  'mouseover',
  'mouseout',
  'mouseenter',
  'mouseleave',
] as const;

export class EventShield {
  private deployed = false;

  private readonly listener = (e: Event): void => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  deploy(): void {
    if (this.deployed) return;
    for (const eventName of SHIELDED_EVENTS) {
      safeAddEventListener(eventName, this.listener, { capture: true });
    }
    this.deployed = true;
  }

  retract(): void {
    if (!this.deployed) return;
    for (const eventName of SHIELDED_EVENTS) {
      safeRemoveEventListener(eventName, this.listener, { capture: true });
    }
    this.deployed = false;
  }

  isDeployed(): boolean {
    return this.deployed;
  }
}
