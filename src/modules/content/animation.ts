/**
 * アニメーションフィードバックモジュール。
 * ダブルクリック成功時の視覚的フィードバックを提供する。
 */

import { safeEventTargetAddEventListener, safeSetTimeout, safeClearTimeout } from '@/utils/safe-natives';

const ANIMATION_DURATION_MS = 1300;
const FAILSAFE_CLEANUP_MS = 1500;

export function triggerDoubleClickAnimation(target: HTMLElement): void {
  const nextAnimation = target.style.animationName === 'smooth-tab-anim-a'
    ? 'smooth-tab-anim-b'
    : 'smooth-tab-anim-a';

  target.style.animation = `${nextAnimation} ${ANIMATION_DURATION_MS}ms ease-in`;

  let failsafeTimerId: number | null = null;

  const cleanup = (): void => {
    if (failsafeTimerId !== null) {
      safeClearTimeout(failsafeTimerId);
      failsafeTimerId = null;
    }
    try {
      target.style.animation = '';
    } catch {
      // 要素が既にDOMから削除されている場合は無視
    }
  };

  safeEventTargetAddEventListener.call(target, 'animationend', cleanup, { once: true });
  failsafeTimerId = safeSetTimeout(cleanup, FAILSAFE_CLEANUP_MS);
}
