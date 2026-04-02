/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://www.mozilla.org/en-US/MPL/2.0/.
 *
 * This file is a part of the Smooth Tab extension, a fork of the
 * original "Tap to Tab" extension by em_te, licensed under the MPL 2.0.
 */
"use strict";

/**
 * @file options.js
 * @description Handles all logic for the options page. It loads/saves settings,
 * validates user input, and provides an interactive test for the double-click delay.
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_OPTIONS = {
    openTabFront: false,
    openTabEnd: true,
    delay: 300,
    blacklist: "",
    enableYouTubeFix: false,
    highPerformanceMode: false
  };

  const storage = chrome.storage.local;

  // --- Element Selectors ---
  const openTabFront = document.getElementById("openTabFront");
  const openTabEnd = document.getElementById("openTabEnd");
  const enableYouTubeFix = document.getElementById("enableYouTubeFix");
  const highPerformanceMode = document.getElementById("highPerformanceMode");
  const delayInput = document.getElementById("delay");
  const blacklistArea = document.getElementById("blacklist");
  const clickMeButton = document.getElementById("clickme");
  const singleClickStatus = document.getElementById("singleclick-status");
  const dblClickStatus = document.getElementById("dblclick-status");

  // --- Load and Display Settings ---
  storage.get(DEFAULT_OPTIONS, o => {
    openTabFront.checked = !!o.openTabFront;
    openTabEnd.checked = !!o.openTabEnd;
    enableYouTubeFix.checked = !!o.enableYouTubeFix;
    highPerformanceMode.checked = !!o.highPerformanceMode;
    delayInput.value = o.delay;
    blacklistArea.value = o.blacklist;
  });

  // --- Event Handlers for Saving Settings ---
  openTabFront.onchange = () => storage.set({ openTabFront: openTabFront.checked });
  openTabEnd.onchange = () => storage.set({ openTabEnd: openTabEnd.checked });
  enableYouTubeFix.onchange = () => storage.set({ enableYouTubeFix: enableYouTubeFix.checked });
  highPerformanceMode.onchange = () => storage.set({ highPerformanceMode: highPerformanceMode.checked });

  // Input validation and saving for the delay setting.
  delayInput.oninput = () => {
    delayInput.value = delayInput.value.replace(/[^0-9]/g, '');
    if (parseInt(delayInput.value, 10) > 1000) delayInput.value = 1000;
  };
  delayInput.onchange = () => {
    let n = parseInt(delayInput.value, 10);
    if (isNaN(n) || n < 200 || n > 1000) {
      n = DEFAULT_OPTIONS.delay;
      delayInput.value = n;
    }
    storage.set({ delay: n });
  };
  
  // Debounced input handling and sanitization for the blacklist textarea.
  let debounceTimer;
  blacklistArea.oninput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const sanitizedList = blacklistArea.value
        .split("\n")
        .map(line => {
          let n = line.trim().replace(/^https?:\/\//, '').replace(/^\*\.?/, '');
          if (n.indexOf("/") > 0) n = n.substr(0, n.indexOf("/"));
          return n;
        })
        .filter(line => line)
        .join("\n");
      
      if (blacklistArea.value !== sanitizedList) {
          blacklistArea.value = sanitizedList;
      }
      storage.set({ blacklist: sanitizedList });
    }, 400); // Saves 400ms after user stops typing.
  };

  // --- Interactive Double-Click Test ---
  let clickTimer = null;
  clickMeButton.onclick = () => {
    singleClickStatus.style.opacity = 0.6;
    dblClickStatus.style.opacity = 0.6;
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      dblClickStatus.style.opacity = 1;
    } else {
      const currentDelay = parseInt(delayInput.value, 10) || DEFAULT_OPTIONS.delay;
      clickTimer = setTimeout(() => {
        clickTimer = null;
        singleClickStatus.style.opacity = 1;
      }, currentDelay);
    }
  };

  // --- Internationalization (i18n) ---
  document.querySelectorAll("*[i18n]").forEach(n => {
    const message = chrome.i18n.getMessage(n.getAttribute("i18n"));
    if (message) n.textContent = message;
  });
  document.title = chrome.i18n.getMessage("optionsTitle");
});