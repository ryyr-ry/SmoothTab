/**
 * ホスト名に基づくアダプタ選択レジストリ。
 * 現在のホスト名からサイト固有アダプタを解決し、
 * YouTube Fix オプションの有効/無効を反映する。
 */

import type { SiteAdapter } from './types';
import { DefaultAdapter } from './default-adapter';
import { YouTubeAdapter } from './youtube-adapter';

const defaultAdapter = new DefaultAdapter();
const youTubeAdapter = new YouTubeAdapter();

export class AdapterRegistry {
  private youTubeFixEnabled = false;
  private readonly isYouTube: boolean;

  constructor(hostname: string) {
    this.isYouTube = hostname.endsWith('.youtube.com');
  }

  setYouTubeFixEnabled(enabled: boolean): void {
    this.youTubeFixEnabled = enabled;
  }

  getAdapter(): SiteAdapter {
    if (this.isYouTube && this.youTubeFixEnabled) {
      return youTubeAdapter;
    }
    return defaultAdapter;
  }
}
