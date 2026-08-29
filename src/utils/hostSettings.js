/**
 * Cài đặt của host (?host=1) — lưu CHỈ trong trình duyệt (localStorage).
 * Vì cùng localStorage, người chơi mở game bình thường trên CÙNG trình duyệt/máy
 * với host cũng sẽ áp dụng các cài đặt này (vd: tắt đếm giờ khi trình chiếu live).
 */
const HOST_SETTINGS_KEY = 'pinnacle_host_settings_v1';

const defaults = { disableTimer: false };

export function getHostSettings() {
  try {
    const raw = localStorage.getItem(HOST_SETTINGS_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return { ...defaults };
}

export function saveHostSettings(settings) {
  try {
    localStorage.setItem(HOST_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
