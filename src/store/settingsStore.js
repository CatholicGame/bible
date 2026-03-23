import { create } from 'zustand';

// Lưu/đọc từ localStorage
const load = () => {
  try {
    const raw = localStorage.getItem('appSettings');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const save = (state) => {
  try {
    localStorage.setItem('appSettings', JSON.stringify({
      music: state.music,
      sound: state.sound,
    }));
  } catch {}
};

const defaults = { music: true, sound: true };
const saved = load();

export const useSettingsStore = create((set, get) => ({
  music: saved?.music ?? defaults.music,
  sound: saved?.sound ?? defaults.sound,

  toggleMusic: () => set((s) => {
    const next = { ...s, music: !s.music };
    save(next);
    return { music: next.music };
  }),

  toggleSound: () => set((s) => {
    const next = { ...s, sound: !s.sound };
    save(next);
    return { sound: next.sound };
  }),
}));
