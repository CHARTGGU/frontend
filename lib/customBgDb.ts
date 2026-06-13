import type { FitMode } from "@/stores/skinStore";

/**
 * 사용자 업로드 배경 사진의 영구 저장소 (브라우저 내장 IndexedDB).
 * blob은 용량이 커서 localStorage(5MB) 대신 IndexedDB에 보관한다.
 * 외부 DB·서버 없음 — window.indexedDB만 사용.
 */

const DB_NAME = "chartskin";
const DB_VERSION = 1;
const STORE = "custom-bg";

/** IndexedDB에 저장되는 레코드 (blob 원본 포함). */
export interface CustomBgRecord {
  id: string;
  name: string;
  blob: Blob;
  fit: FitMode;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("이 브라우저는 사진 보관을 지원하지 않습니다."));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("저장소를 열 수 없습니다."));
  });
}

/** 트랜잭션 1건을 Promise로 감싸는 헬퍼. */
function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = run(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("저장소 작업에 실패했습니다."));
        };
      })
  );
}

export function putCustomBg(record: CustomBgRecord): Promise<void> {
  return tx("readwrite", (s) => s.put(record)).then(() => undefined);
}

export function listCustomBg(): Promise<CustomBgRecord[]> {
  return tx<CustomBgRecord[]>("readonly", (s) => s.getAll()).then((rows) =>
    [...rows].sort((a, b) => a.createdAt - b.createdAt)
  );
}

export function deleteCustomBg(id: string): Promise<void> {
  return tx("readwrite", (s) => s.delete(id)).then(() => undefined);
}
