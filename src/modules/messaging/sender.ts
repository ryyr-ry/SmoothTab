/**
 * 型安全なメッセージ送信ユーティリティ。
 */

import type { ExtensionMessage } from './types';

export async function sendMessageToBackground(
  message: ExtensionMessage,
): Promise<boolean> {
  try {
    await browser.runtime.sendMessage(message);
    return true;
  } catch (error) {
    console.error('Smooth Tab [sendMessageToBackground] 送信失敗:', error);
    return false;
  }
}

export async function sendMessageToTab(
  tabId: number,
  message: ExtensionMessage,
  frameId?: number,
): Promise<void> {
  try {
    await browser.tabs.sendMessage(
      tabId,
      message,
      frameId != null ? { frameId } : undefined,
    );
  } catch {
    // タブが閉じられた等の正常なケースで発生する
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
