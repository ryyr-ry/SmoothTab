/**
 * アニメーションフィードバックモジュール。
 * ダブルクリック成功時の視覚的フィードバックを提供する。
 */

import { safeEventTargetAddEventListener, safeSetTimeout } from '@/utils/safe-natives';

const ANIMATION_DURATION_MS = 1300;
const FAILSAFE_CLEANUP_MS = 1500;

export function triggerDoubleClickAnimation(target: HTMLElement): void {
  const nextAnimation = target.style.animationName === 'qt-animation-a'
    ? 'qt-animation-b'
    : 'qt-animation-a';

  target.style.animation = `${nextAnimation} ${ANIMATION_DURATION_MS}ms ease-in`;

  const cleanup = (): void => {
    try {
      target.style.animation = '';
    } catch {
      // 要素が既にDOMから削除されている場合は無視
    }
  };

  safeEventTargetAddEventListener.call(target, 'animationend', cleanup, { once: true });
  safeSetTimeout(cleanup, FAILSAFE_CLEANUP_MS);
}
