"use strict";

/**
 * @file welcome.js
 * @description Populates the welcome page with localized strings using the chrome.i18n API.
 */

// Find all elements with an `i18n` attribute and replace their content.
document.querySelectorAll("*[i18n]").forEach(n => {
  const messageKey = n.getAttribute("i18n");
  const message = chrome.i18n.getMessage(messageKey);
  if (message) {
      n.textContent = message;
  }
});

// Set the page's <title> dynamically from the localized header text.
document.title = chrome.i18n.getMessage("thankHeader");