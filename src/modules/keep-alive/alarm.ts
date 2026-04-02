/**
 * Keep-Alive アラーム管理モジュール。
 * High Performance Mode が有効な場合、
 * サービスワーカーを定期的に起こして延命する。
 */

const ALARM_NAME = 'smooth-tab-keep-alive';
const PERIOD_MINUTES = 0.5;

export async function startKeepAlive(): Promise<void> {
  await browser.alarms.clear(ALARM_NAME);
  await browser.alarms.create(ALARM_NAME, {
    delayInMinutes: PERIOD_MINUTES,
    periodInMinutes: PERIOD_MINUTES,
  });
}

export async function stopKeepAlive(): Promise<void> {
  await browser.alarms.clear(ALARM_NAME);
}

export function isKeepAliveAlarm(alarm: Browser.alarms.Alarm): boolean {
  return alarm.name === ALARM_NAME;
}
