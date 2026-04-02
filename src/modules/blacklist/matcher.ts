/**
 * ブラックリストドメインマッチングの単一実装。
 * background と content の両方からインポートされる。
 */

export type BlacklistMap = Record<string, boolean>;

export function parseBlacklist(raw: string): BlacklistMap {
  const map: BlacklistMap = {};
  if (!raw) return map;

  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      map[trimmed] = true;
    }
  }
  return map;
}

export function isBlacklisted(hostname: string, blacklist: BlacklistMap): boolean {
  const parts = hostname.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    if (blacklist[candidate]) return true;
  }
  return false;
}
