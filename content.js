/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://www.mozilla.org/en-US/MPL/2.0/.
 *
 * This file is a part of the Smooth Tab extension, a fork of the
 * original "Tap to Tab" extension by em_te, licensed under the MPL 2.0.
 */
(function() {
  "use strict";

  // Cache native browser functions to prevent breakage from page scripts (monkey-patching).
  const safeAddEventListener = window.addEventListener;
  const safeRemoveEventListener = window.removeEventListener;
  const safeDispatchEvent = document.dispatchEvent;
  const SafeCustomEvent = window.CustomEvent;
  const SafeMouseEvent = window.MouseEvent;
  const safeSetTimeout = window.setTimeout;
  const safeClearTimeout = window.clearTimeout;

  // Global error handlers to catch any unexpected errors.
  self.addEventListener('error', (event) => {
    console.error('Smooth Tab [Uncaught Error]:', { message: event.message, filename: event.filename, lineno: event.lineno, error: event.error });
  });
  self.addEventListener('unhandledrejection', (event) => {
    console.error('Smooth Tab [Unhandled Promise Rejection]:', { reason: event.reason });
  });

  /**
   * Waits for the extension context to be available before initializing.
   * This is a robustness measure for edge cases during extension reloads.
   */
  function bootstrap(retryCount = 0) {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      initialize();
    } else {
      if (retryCount < 10) {
        safeSetTimeout(() => bootstrap(retryCount + 1), 100);
      } else {
        console.error("Smooth Tab: Failed to initialize content script after multiple retries.");
      }
    }
  }

  /**
   * Initializes the main QuickTab class.
   */
  function initialize() {
    // Notify and tear down any old instances of this script.
    const TEARDOWN_EVENT_NAME = `quick-tab-teardown-${chrome.runtime.id}`;
    safeDispatchEvent.call(document, new SafeCustomEvent(TEARDOWN_EVENT_NAME));

    class QuickTab {
      constructor() {
        this.handleClick = this.handleClick.bind(this);
        this.destroy = this.destroy.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.shieldListener = this.shieldListener.bind(this);
        this.init = this.init.bind(this);
        this.init();
      }

      init() {
        this.pending = null; 
        this.lastAnchor = null;
        this.pendingEvent = null;
        this.blacklist = false; 
        this.delay = 300;
        this.isShieldDeployed = false;
        this.isYouTube = window.location.hostname.endsWith('.youtube.com');
        this.youTubeFixEnabled = false;
        
        safeAddEventListener.call(document, TEARDOWN_EVENT_NAME, this.destroy);
        safeAddEventListener.call(window, 'click', this.handleClick, { capture: true });
        
        // Add cleanup listeners.
        safeAddEventListener.call(window, "beforeunload", () => {
          if (this.pending) safeClearTimeout(this.pending);
          this.retractShield();
        });
        chrome.runtime.onMessage.addListener(this.handleMessage);

        // Report that this content script is ready to receive settings.
        try {
          chrome.runtime.sendMessage({ type: 'CONTENT_SCRIPT_READY' });
        } catch (e) {
          // This can happen if the background page is not ready, which is fine.
          // The bootstrap logic will retry.
        }
      }

      destroy() {
        safeRemoveEventListener.call(document, TEARDOWN_EVENT_NAME, this.destroy);
        safeRemoveEventListener.call(window, 'click', this.handleClick, { capture: true });
        if (this.pending) safeClearTimeout(this.pending);
        chrome.runtime.onMessage.removeListener(this.handleMessage);
        this.retractShield();
      }
      
      /**
       * Handles real-time setting updates from the background script.
       */
      handleMessage(message, sender, sendResponse) {
        if (sender.tab) return; // Ignore messages from other content scripts
        
        // Handle initial settings pushed from background on ready signal.
        if (message.type === 'INIT') {
          const { blacklist, delay, enableYouTubeFix } = message.payload;
          if (typeof blacklist === 'boolean') this.blacklist = blacklist;
          if (typeof delay === 'number') this.delay = delay;
          if (typeof enableYouTubeFix === 'boolean') this.youTubeFixEnabled = enableYouTubeFix;
        }

        if (message.type === 'OPTIONS_UPDATED') {
          const { delay, blacklist } = message.payload;
          if (typeof delay === 'number') this.delay = delay;
          if (typeof blacklist === 'object') {
            const host = window.location.hostname;
            let isBlacklisted = false;
            if (blacklist[host] || (host.lastIndexOf(".", host.lastIndexOf(".") - 1) >= 0 && blacklist[host.substr(host.lastIndexOf(".", host.lastIndexOf(".") - 1) + 1)])) {
                isBlacklisted = true;
            }
            this.blacklist = isBlacklisted;
          }
        }
        if (message.type === 'YOUTUBE_FIX_TOGGLED') {
          this.youTubeFixEnabled = !!message.payload.enabled;
        }
      }

      stopEvent(e) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
      
      /**
       * The core of the "event shield" for YouTube. This listener captures and
       * neutralizes all mouse movement events to prevent them from interfering with
       * our programmatic single-click reproduction.
       */
      shieldListener(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }

      deployShield() {
        if (this.isShieldDeployed) return;
        const eventsToBlock = ['mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
        for (const event of eventsToBlock) {
          safeAddEventListener.call(window, event, this.shieldListener, { capture: true });
        }
        this.isShieldDeployed = true;
      }

      retractShield() {
        if (this.isShieldDeployed) {
          const eventsToBlock = ['mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
          for (const event of eventsToBlock) {
            safeRemoveEventListener.call(window, event, this.shieldListener, { capture: true });
          }
          this.isShieldDeployed = false;
        }
      }

      /**
       * Schedules the reproduction of a single-click action after a delay.
       * Employs a tactical approach based on the context.
       */
      scheduleClick() {
        this.pending = safeSetTimeout(() => {
          this.retractShield();
          const anchor = this.lastAnchor;
          const e = this.pendingEvent;
          this.pending = null;
          this.lastAnchor = null;
          this.pendingEvent = null;
          
          // Survival check: Ensure the anchor still exists in the document.
          if (anchor && anchor.isConnected && e) {
            // For YouTube video previews, dispatch a synthetic MouseEvent with original coordinates.
            if (this.isYouTube && this.youTubeFixEnabled && anchor.querySelector('video')) {
              safeDispatchEvent.call(e.target, new SafeMouseEvent("click", {
                bubbles: true, cancelable: true, view: window, clientX: e.clientX, clientY: e.clientY
              }));
            } else {
              // For all other links, use the standard .click() method for maximum compatibility.
              anchor.click();
            }
          }
        }, this.delay);
      }
      
      /**
       * Determines the most visually appropriate element to apply the animation to on YouTube.
       */
      chooseAnimationTarget(event, anchor) {
        if (!this.isYouTube || !this.youTubeFixEnabled) return anchor;
        const point = { x: event.clientX, y: event.clientY };
        const elementsAtPoint = document.elementsFromPoint ? document.elementsFromPoint(point.x, point.y) : [event.target];
        const prioritySelectors = ['ytd-channel-name', '#video-title', '#thumbnail', 'ytd-thumbnail', 'ytd-rich-item-renderer', 'ytd-compact-video-renderer'];
        for (const selector of prioritySelectors) {
          for (const element of elementsAtPoint) {
            const target = element.closest(selector);
            if (target && anchor.contains(target)) return target;
          }
        }
        return anchor;
      }
      
      /**
       * The main handler for all captured click events.
       */
      handleClick(e) {
        if (!e.isTrusted) return;
        
        const resetState = () => {
            this.retractShield();
            if (this.pending) {
                safeClearTimeout(this.pending);
                this.pending = null;
                this.lastAnchor = null;
                this.pendingEvent = null;
            }
        };

        let anchor = e.target.closest('a');
        
        // Advanced reconnaissance for Shadow DOM.
        if (!anchor && e.composedPath) {
          const path = e.composedPath();
          for (const element of path) {
            if (element.tagName === 'A' && element.href) {
              anchor = element;
              break;
            }
          }
        }

        if (!anchor || !anchor.href || this.blacklist || e.ctrlKey || e.shiftKey || e.metaKey || e.altKey || e.button !== 0) {
            resetState();
            return;
        }
        if (anchor.href.includes('/imgres?')) return;

        if (this.pending) {
          if (this.lastAnchor?.isSameNode(anchor)) {
            // --- Double-click successful ---
            resetState();
            chrome.runtime.sendMessage({ newTab: anchor.href });

            // --- Animation Logic ---
            let animNode = this.chooseAnimationTarget(e, anchor);
            if (animNode.style.animationName === 'qt-animation-a') {
              animNode.style.animation = 'qt-animation-b 1.3s ease-in';
            } else {
              animNode.style.animation = 'qt-animation-a 1.3s ease-in';
            }
            const cleanup = () => {
              try {
                animNode.style.animation = '';
              } catch (err) {}
            };
            safeAddEventListener.call(animNode, 'animationend', cleanup, { once: true });
            safeSetTimeout(cleanup, 1500); // Failsafe cleanup

            this.stopEvent(e);
          } else {
            // --- A different link was clicked ---
            resetState();
            this.lastAnchor = anchor;
            this.pendingEvent = e;
            if (this.isYouTube && this.youTubeFixEnabled && anchor.querySelector('video')) {
              this.deployShield();
            }
            this.scheduleClick();
            this.stopEvent(e);
          }
        } else {
          // --- First click ---
          this.lastAnchor = anchor;
          this.pendingEvent = e;
          if (this.isYouTube && this.youTubeFixEnabled && anchor.querySelector('video')) {
            this.deployShield();
          }
          this.scheduleClick();
          this.stopEvent(e);
        }
      }
    }
    new QuickTab();
  }
  
  bootstrap();
})();