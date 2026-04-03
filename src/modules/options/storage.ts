/**
 * 型安全なストレージ読み書きモジュール。
 * browser.storage.local をラップし、ExtensionOptions 型を保証する。
 */

import { DEFAULT_OPTIONS, clampDelay, clampRightClickDelay, type ExtensionOptions } from './types';

export async function getOptions(): Promise<ExtensionOptions> {
  try {
    const result = await browser.storage.local.get(DEFAULT_OPTIONS);
    return {
      openTabFront: Boolean(result.openTabFront),
      openTabEnd: Boolean(result.openTabEnd),
      delay: clampDelay(parseInt(String(result.delay), 10)),
      blacklist: typeof result.blacklist === 'string' ? result.blacklist : DEFAULT_OPTIONS.blacklist,
      enableYouTubeFix: Boolean(result.enableYouTubeFix),
      highPerformanceMode: Boolean(result.highPerformanceMode),
      enableRightDoubleClickClose: Boolean(result.enableRightDoubleClickClose),
      protectPinnedTabs: Boolean(result.protectPinnedTabs),
      rightDoubleClickDelay: clampRightClickDelay(parseInt(String(result.rightDoubleClickDelay), 10)),
    };
  } catch (error) {
    console.error('Smooth Tab [getOptions] ストレージ読み込み失敗。デフォルト値を使用。', error);
    return { ...DEFAULT_OPTIONS };
  }
}

export async function saveOption<K extends keyof ExtensionOptions>(
  key: K,
  value: ExtensionOptions[K],
): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

export async function saveOptions(options: Partial<ExtensionOptions>): Promise<void> {
  await browser.storage.local.set(options);
}
