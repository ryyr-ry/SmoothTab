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
    const trimmed = line.trim().toLowerCase();
    if (trimmed) {
      map[trimmed] = true;
    }
  }
  return map;
}

export function isBlacklisted(hostname: string, blacklist: BlacklistMap): boolean {
  const normalizedHost = hostname.toLowerCase();

  // 単一ラベルホスト（localhost等）の直接マッチ
  if (blacklist[normalizedHost]) return true;

  // サブドメインの階層的マッチ
  const parts = normalizedHost.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join('.');
    if (blacklist[candidate]) return true;
  }
  return false;
}
