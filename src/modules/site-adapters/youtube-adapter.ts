/**
 * YouTube 固有アダプタ。
 * 動画プレビューのクリック再現、アニメーション対象選定、
 * マウスイベントシールドの必要性判定を担当。
 */

import { SafeMouseEvent, safeDocumentDispatchEvent } from '@/utils/safe-natives';
import type { SiteAdapter } from './types';

const YOUTUBE_ANIMATION_SELECTORS = [
  'ytd-channel-name',
  '#video-title',
  '#thumbnail',
  'ytd-thumbnail',
  'ytd-rich-item-renderer',
  'ytd-compact-video-renderer',
] as const;

function hasVideoPreview(anchor: HTMLAnchorElement): boolean {
  return anchor.querySelector('video') !== null;
}

export class YouTubeAdapter implements SiteAdapter {
  needsCustomReplay(anchor: HTMLAnchorElement): boolean {
    return hasVideoPreview(anchor);
  }

  replayClick(target: EventTarget, originalEvent: MouseEvent): void {
    const syntheticClick = new SafeMouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: originalEvent.clientX,
      clientY: originalEvent.clientY,
    });
    safeDocumentDispatchEvent.call(target, syntheticClick);
  }

  resolveAnimationTarget(event: MouseEvent, anchor: HTMLAnchorElement): HTMLElement {
    const point = { x: event.clientX, y: event.clientY };
    const elementsAtPoint = document.elementsFromPoint
      ? document.elementsFromPoint(point.x, point.y)
      : [event.target as Element];

    for (const selector of YOUTUBE_ANIMATION_SELECTORS) {
      for (const element of elementsAtPoint) {
        const target = element.closest(selector);
        if (target && anchor.contains(target)) {
          return target as HTMLElement;
        }
      }
    }

    return anchor;
  }

  needsEventShield(anchor: HTMLAnchorElement): boolean {
    return hasVideoPreview(anchor);
  }
}
