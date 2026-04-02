/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://www.mozilla.org/en-US/MPL/2.0/.
 *
 * This file is a part of the Smooth Tab extension, a fork of the
 * original "Tap to Tab" extension by em_te, licensed under the MPL 2.0.
 */
"use strict";

const DEFAULT_OPTIONS = {
  openTabFront: false,
  openTabEnd: true,
  delay: 300,
  blacklist: "",
  enableYouTubeFix: false,
  highPerformanceMode: false
};

// --- Constants for Keep-Alive Alarm ---
const KEEP_ALIVE_ALARM_NAME = 'smooth-tab-keep-alive';
const KEEP_ALIVE_PERIOD_SECONDS = 29;

// --- Global Error Handlers ---
self.addEventListener('error', (event) => {
  console.error('Smooth Tab [Uncaught Error in background]:', {
    message: event.message, filename: event.filename, lineno: event.lineno, error: event.error
  });
});
self.addEventListener('unhandledrejection', (event) => {
  console.error('Smooth Tab [Unhandled Promise Rejection in background]:', { reason: event.reason });
});

/**
 * Handles extension installation or update.
 * On first install, opens a welcome page.
 * On update, re-injects content scripts into existing tabs to prevent "zombie" scripts.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await chrome.storage.local.set(DEFAULT_OPTIONS);
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }
  
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*", "file://*/*"] });
  for (const tab of tabs) {
    try {
      // Only inject the scripts. Do not send a message here, as the content script
      // might not be ready to receive it. It will ask for settings when it's ready.
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["content.js"],
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id, allFrames: true },
        files: ["content.css"],
      });
    } catch (e) {} // Ignore errors on protected pages.
  }
});

/**
 * Listens for messages from content scripts.
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Request to open a new tab.
  if (msg.newTab) {
    (async () => {
      try {
        const options = await getOptions();
        const o = {
          url: msg.newTab,
          active: !!options.openTabFront
        };
        if (sender?.tab?.id) o.openerTabId = sender.tab.id;
        if (!options.openTabEnd && sender?.tab?.index != null) o.index = sender.tab.index + 1;
        await chrome.tabs.create(o);
      } catch (e) {
        console.error("Smooth Tab [tabs.create] Failed:", { error: e.message, url: msg.newTab, sender });
      }
    })();
  }
  
  // Content script reports it's ready and asks for initial settings.
  if (msg.type === 'CONTENT_SCRIPT_READY') {
    (async () => {
      try {
        const options = await getOptions();
        const domain = sender.url ? new URL(sender.url).hostname : "";
        let isBlacklisted = false;
        if (options.blacklist[domain]) {
            isBlacklisted = true;
        } else {
            const pos = domain.lastIndexOf(".", domain.lastIndexOf(".") - 1);
            if (pos >= 0 && options.blacklist[domain.substr(pos + 1)]) {
                isBlacklisted = true;
            }
        }
        
        const initPayload = {
          blacklist: isBlacklisted,
          delay: options.clickDelay,
          enableYouTubeFix: options.enableYouTubeFix
        };
        
        // Send the settings back to the specific tab that asked.
        chrome.tabs.sendMessage(sender.tab.id, { type: 'INIT', payload: initPayload });
      } catch(e) {} // Suppress errors if tab is closed before response.
    })();
  }
});

/**
 * A robust, stateless helper to retrieve and sanitize user options from storage.
 * @returns {Promise<object>} A promise resolving to a sanitized options object.
 */
async function getOptions() {
  try {
    const result = await chrome.storage.local.get(DEFAULT_OPTIONS);
    const options = {
      openTabFront: !!result.openTabFront,
      openTabEnd: !!result.openTabEnd,
      delay: parseInt(result.delay, 10) || DEFAULT_OPTIONS.delay,
      blacklist: typeof result.blacklist === 'string' ? result.blacklist : DEFAULT_OPTIONS.blacklist,
      enableYouTubeFix: !!result.enableYouTubeFix,
      highPerformanceMode: !!result.highPerformanceMode
    };
    if (options.delay < 200 || options.delay > 1000) {
      options.delay = DEFAULT_OPTIONS.delay;
    }
    const blacklistObj = {};
    if (options.blacklist) {
      options.blacklist.split("\n").forEach(n => { if (n.trim()) blacklistObj[n.trim()] = true; });
    }
    return {
      openTabFront: options.openTabFront,
      openTabEnd: options.openTabEnd,
      clickDelay: options.delay,
      blacklist: blacklistObj,
      enableYouTubeFix: options.enableYouTubeFix,
      highPerformanceMode: options.highPerformanceMode
    };
  } catch (e) {
    console.error("Smooth Tab [getOptions] Failed. Falling back to defaults.", e);
    return {
      openTabFront: DEFAULT_OPTIONS.openTabFront,
      openTabEnd: DEFAULT_OPTIONS.openTabEnd,
      clickDelay: DEFAULT_OPTIONS.delay,
      blacklist: {},
      enableYouTubeFix: DEFAULT_OPTIONS.enableYouTubeFix,
      highPerformanceMode: DEFAULT_OPTIONS.highPerformanceMode
    };
  }
}

/**
 * Listens for changes in storage and broadcasts them to the relevant content scripts.
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  // General options are broadcast to all tabs.
  const broadcastGeneralPayload = {};
  if (changes.delay) broadcastGeneralPayload.delay = changes.delay.newValue;
  if (changes.blacklist) {
    (async () => {
      const { blacklist } = await getOptions();
      chrome.tabs.query({ url: ["http://*/*", "https://*/*", "file://*/*"] }, (tabs) => {
        for (const tab of tabs) {
          try { chrome.tabs.sendMessage(tab.id, { type: 'OPTIONS_UPDATED', payload: { blacklist } }); }
          catch (e) {}
        }
      });
    })();
  }
  if (Object.keys(broadcastGeneralPayload).length > 0) {
      chrome.tabs.query({ url: ["http://*/*", "https://*/*", "file://*/*"] }, (tabs) => {
        for (const tab of tabs) {
          try { chrome.tabs.sendMessage(tab.id, { type: 'OPTIONS_UPDATED', payload: broadcastGeneralPayload }); }
          catch (e) {}
        }
      });
  }

  // YouTube-specific option changes are only sent to YouTube tabs for efficiency.
  if (changes.enableYouTubeFix) {
    const enabled = !!changes.enableYouTubeFix.newValue;
    chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
      for (const tab of tabs) {
        try { chrome.tabs.sendMessage(tab.id, { type: 'YOUTUBE_FIX_TOGGLED', payload: { enabled } }); }
        catch(e) {}
      }
    });
  }
  
  // Handle High Performance Mode toggling.
  if (changes.highPerformanceMode) {
    const enabled = !!changes.highPerformanceMode.newValue;
    if (enabled) {
      startKeepAlive();
    } else {
      stopKeepAlive();
    }
  }
});

/**
 * Opens the options page when the toolbar icon is clicked.
 */
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// --- High Performance Mode (Keep-Alive) Logic ---

/**
 * Starts the keep-alive alarm to keep the service worker active.
 */
async function startKeepAlive() {
  await chrome.alarms.clear(KEEP_ALIVE_ALARM_NAME); // Clear any existing alarm
  chrome.alarms.create(KEEP_ALIVE_ALARM_NAME, {
    delayInMinutes: KEEP_ALIVE_PERIOD_SECONDS / 60,
    periodInMinutes: KEEP_ALIVE_PERIOD_SECONDS / 60
  });
}

/**
 * Stops the keep-alive alarm.
 */
async function stopKeepAlive() {
  await chrome.alarms.clear(KEEP_ALIVE_ALARM_NAME);
}

/**
 * Listens for the keep-alive alarm. The event itself is enough to extend the SW lifetime.
 */
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === KEEP_ALIVE_ALARM_NAME) {
    // No action needed. The event listener itself keeps the service worker alive.
  }
});

/**
 * Self-executing function to check and set the initial alarm state on SW startup.
 * This is the most robust way to ensure the alarm state is correct.
 */
(async () => {
    const options = await getOptions();
    if (options.highPerformanceMode) {
        startKeepAlive();
    } else {
        stopKeepAlive();
    }
})();