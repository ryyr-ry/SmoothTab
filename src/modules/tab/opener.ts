/**
 * タブ作成ロジックモジュール。
 * オプションに基づいて新しいタブの位置とフォーカスを制御する。
 */

import type { ExtensionOptions } from '@/modules/options/types';

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export interface TabCreationContext {
  readonly url: string;
  readonly senderTabId?: number;
  readonly senderTabIndex?: number;
}

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function openNewTab(
  context: TabCreationContext,
  options: Pick<ExtensionOptions, 'openTabFront' | 'openTabEnd'>,
): Promise<void> {
  if (!isAllowedUrl(context.url)) {
    console.warn('Smooth Tab [openNewTab] 許可されていないURLプロトコル:', context.url);
    return;
  }

  const createProperties: Browser.tabs.CreateProperties = {
    url: context.url,
    active: options.openTabFront,
  };

  if (context.senderTabId != null) {
    createProperties.openerTabId = context.senderTabId;
  }

  if (!options.openTabEnd && context.senderTabIndex != null) {
    createProperties.index = context.senderTabIndex + 1;
  }

  try {
    await browser.tabs.create(createProperties);
  } catch (error) {
    console.error('Smooth Tab [openNewTab] タブ作成失敗:', {
      error,
      url: context.url,
    });
  }
}
