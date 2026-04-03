/**
 * クリックハンドラ（オーケストレータ）。
 * link-resolver, click-guard, double-click-detector, animation, SiteAdapter を統合する。
 * 自身はサイト固有ロジックを一切持たない。
 *
 * 設計上の注意: different-link の場合、最初のリンクのクリックは消失する。
 * これは意図的な動作で、ユーザーが別リンクに注目を移したことを意味する。
 * 最初のリンクをリプレイすると、2つの同時ナビゲーションが発生し、
 * ユーザー体験が悪化するため行わない。
 */

import { safeAddEventListener, safeRemoveEventListener } from '@/utils/safe-natives';
import { resolveAnchor } from './link-resolver';
import { shouldIgnoreClick, shouldIgnoreAnchor, type ClickGuardState } from './click-guard';
import { DoubleClickDetector } from './double-click-detector';
import { triggerDoubleClickAnimation } from './animation';
import { EventShield } from './event-shield';
import type { SiteAdapter } from '@/modules/site-adapters/types';
import type { AdapterRegistry } from '@/modules/site-adapters/adapter-registry';
import { sendMessageToBackground, isContextValid } from '@/modules/messaging/sender';

function stopEvent(e: MouseEvent): void {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
}

export class ClickHandler {
  private readonly detector: DoubleClickDetector;
  private readonly shield: EventShield;
  private readonly adapterRegistry: AdapterRegistry;
  private readonly guardState: ClickGuardState;
  private readonly handleClick: (e: MouseEvent) => void;

  constructor(
    adapterRegistry: AdapterRegistry,
    guardState: ClickGuardState,
    initialDelay: number,
  ) {
    this.adapterRegistry = adapterRegistry;
    this.guardState = guardState;
    this.detector = new DoubleClickDetector(initialDelay);
    this.shield = new EventShield();
    this.handleClick = this.onClick.bind(this);
  }

  attach(): void {
    safeAddEventListener('click', this.handleClick, { capture: true });
  }

  detach(): void {
    safeRemoveEventListener('click', this.handleClick, { capture: true });
    this.detector.clearPending();
    this.shield.retract();
  }

  setDelay(delay: number): void {
    this.detector.setDelay(delay);
  }

  private onClick(e: MouseEvent): void {
    if (!isContextValid()) {
      this.detach();
      return;
    }

    const anchor = resolveAnchor(e);

    if (!anchor || shouldIgnoreAnchor(anchor) || shouldIgnoreClick(e, this.guardState)) {
      this.resetState();
      return;
    }

    const adapter = this.adapterRegistry.getAdapter();
    const result = this.detector.detect(anchor);

    switch (result.kind) {
      case 'double-click':
        this.onDoubleClick(e, anchor, adapter);
        break;

      case 'first-click':
      case 'different-link':
        this.onFirstClick(e, anchor, adapter);
        break;
    }
  }

  private onDoubleClick(
    e: MouseEvent,
    anchor: HTMLAnchorElement,
    adapter: SiteAdapter,
  ): void {
    this.resetState();
    sendMessageToBackground({ type: 'NEW_TAB', url: anchor.href });

    const animTarget = adapter.resolveAnimationTarget(e, anchor);
    triggerDoubleClickAnimation(animTarget);

    stopEvent(e);
  }

  private onFirstClick(
    e: MouseEvent,
    anchor: HTMLAnchorElement,
    adapter: SiteAdapter,
  ): void {
    if (adapter.needsEventShield(anchor)) {
      this.shield.deploy();
    }

    this.detector.scheduleSingleClick(anchor, e, (savedAnchor, savedEvent) => {
      this.shield.retract();
      if (adapter.needsCustomReplay(savedAnchor)) {
        adapter.replayClick(savedEvent.target!, savedEvent);
      } else {
        savedAnchor.click();
      }
    });

    stopEvent(e);
  }

  private resetState(): void {
    this.shield.retract();
    this.detector.clearPending();
  }
}
