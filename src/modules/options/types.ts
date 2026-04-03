/**
 * 拡張機能オプションの型定義とデフォルト値。
 * プロジェクト全体で唯一の情報源として参照される。
 */

export interface ExtensionOptions {
  readonly openTabFront: boolean;
  readonly openTabEnd: boolean;
  readonly delay: number;
  readonly blacklist: string;
  readonly enableYouTubeFix: boolean;
  readonly highPerformanceMode: boolean;
  readonly enableRightDoubleClickClose: boolean;
  readonly protectPinnedTabs: boolean;
  readonly rightDoubleClickDelay: number;
}

export const DEFAULT_OPTIONS: Readonly<ExtensionOptions> = {
  openTabFront: false,
  openTabEnd: true,
  delay: 300,
  blacklist: '',
  enableYouTubeFix: false,
  highPerformanceMode: false,
  enableRightDoubleClickClose: false,
  protectPinnedTabs: true,
  rightDoubleClickDelay: 500,
} as const;

export const DELAY_MIN = 200;
export const DELAY_MAX = 1000;

export const RIGHT_CLICK_DELAY_MIN = 100;
export const RIGHT_CLICK_DELAY_MAX = 2000;

export function clampDelay(value: number): number {
  if (!Number.isFinite(value) || value < DELAY_MIN || value > DELAY_MAX) {
    return DEFAULT_OPTIONS.delay;
  }
  return value;
}

export function clampRightClickDelay(value: number): number {
  if (!Number.isFinite(value) || value < RIGHT_CLICK_DELAY_MIN || value > RIGHT_CLICK_DELAY_MAX) {
    return DEFAULT_OPTIONS.rightDoubleClickDelay;
  }
  return value;
}
