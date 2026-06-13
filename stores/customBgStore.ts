import { create } from "zustand";
import type { FitMode } from "@/stores/skinStore";
import {
  deleteCustomBg,
  listCustomBg,
  putCustomBg,
  type CustomBgRecord,
} from "@/lib/customBgDb";
import { downscaleImage } from "@/lib/downscaleImage";

/** 커스텀 배경 id 프리픽스 — preset 스킨 id와 구분한다. */
export const CUSTOM_BG_PREFIX = "custom-";

/** 원본 파일 크기 상한(검증용). 초과 시 거부. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** 화면에서 쓰는 커스텀 배경 (blob → objectUrl 해석본). */
export interface CustomBackground {
  id: string;
  name: string;
  objectUrl: string;
  fit: FitMode;
}

interface CustomBgState {
  items: CustomBackground[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (file: File) => Promise<string>;
  remove: (id: string) => Promise<void>;
}

function toItem(record: CustomBgRecord): CustomBackground {
  return {
    id: record.id,
    name: record.name,
    objectUrl: URL.createObjectURL(record.blob),
    fit: record.fit,
  };
}

export const useCustomBgStore = create<CustomBgState>()((set, get) => ({
  items: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return;
    const records = await listCustomBg();
    set({ items: records.map(toItem), loaded: true });
  },

  add: async (file) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 올릴 수 있습니다.");
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new Error("15MB 이하 이미지만 올릴 수 있습니다.");
    }

    const blob = await downscaleImage(file);
    const record: CustomBgRecord = {
      id: `${CUSTOM_BG_PREFIX}${crypto.randomUUID()}`,
      name: file.name.replace(/\.[^.]+$/, "") || "내 사진",
      blob,
      fit: "cover",
      createdAt: Date.now(),
    };

    await putCustomBg(record);
    set((s) => ({ items: [...s.items, toItem(record)] }));
    return record.id;
  },

  remove: async (id) => {
    await deleteCustomBg(id);
    set((s) => {
      const target = s.items.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.objectUrl);
      return { items: s.items.filter((i) => i.id !== id) };
    });
  },
}));

export function isCustomBgId(id: string | null): boolean {
  return !!id && id.startsWith(CUSTOM_BG_PREFIX);
}
