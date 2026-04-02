/**
 * Keep-Alive アラーム管理モジュール。
 * High Performance Mode が有効な場合、
 * サービスワーカーを定期的に起こして延命する。
 */

const ALARM_NAME = 'smooth-tab-keep-alive';
const PERIOD_SECONDS = 29;

export async function startKeepAlive(): Promise<void> {
  await browser.alarms.clear(ALARM_NAME);
  browser.alarms.create(ALARM_NAME, {
    delayInMinutes: PERIOD_SECONDS / 60,
    periodInMinutes: PERIOD_SECONDS / 60,
  });
}

export async function stopKeepAlive(): Promise<void> {
  await browser.alarms.clear(ALARM_NAME);
}

export function isKeepAliveAlarm(alarm: Browser.alarms.Alarm): boolean {
  return alarm.name === ALARM_NAME;
}
