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
  if (blacklist[hostname]) return true;

  const lastDotIndex = hostname.lastIndexOf('.');
  if (lastDotIndex <= 0) return false;

  const secondLastDotIndex = hostname.lastIndexOf('.', lastDotIndex - 1);
  if (secondLastDotIndex >= 0) {
    const rootDomain = hostname.slice(secondLastDotIndex + 1);
    if (blacklist[rootDomain]) return true;
  }

  return false;
}
