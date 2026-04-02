/**
 * 型安全なメッセージ送信ユーティリティ。
 */

import type { ExtensionMessage } from './types';

export function sendMessageToBackground(message: ExtensionMessage): void {
  try {
    browser.runtime.sendMessage(message);
  } catch (error) {
    console.error('Smooth Tab [sendMessageToBackground] 送信失敗:', error);
  }
}

export async function sendMessageToTab(tabId: number, message: ExtensionMessage): Promise<void> {
  try {
    await browser.tabs.sendMessage(tabId, message);
  } catch {
    // タブが閉じられた等の正常なケースで発生するため、警告のみ
  }
}

export async function broadcastToTabs(
  urlPatterns: string[],
  message: ExtensionMessage,
): Promise<void> {
  const tabs = await browser.tabs.query({ url: urlPatterns });
  for (const tab of tabs) {
    if (tab.id != null) {
      await sendMessageToTab(tab.id, message);
    }
  }
}
