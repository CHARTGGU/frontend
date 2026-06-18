"use client";

import { useEffect, useState } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { useCustomBgStore } from "@/stores/customBgStore";
import { useChartStore } from "@/stores/chartStore";
import { useStickerStore } from "@/stores/stickerStore";
import BackgroundControls from "./BackgroundControls";
import BrickControls from "./BrickControls";
import CustomBgUpload from "./CustomBgUpload";
import FireControls from "./FireControls";
import WaterfallControls from "./WaterfallControls";
import SkinCard from "./SkinCard";
import LineStylePicker from "./LineStylePicker";
import {
  BRICK_SKIN_STYLE,
  CATEGORY_META,
  CROSS_SKIN_STYLE,
  INDICATOR_BINDING_META,
  INDICATOR_BINDING_ORDER,
  SKINS_BY_CATEGORY,
  STICKER_IMAGE,
  type BackgroundSkin,
  type Skin,
  type SkinCategory,
} from "./presets";

const CATEGORY_ORDER: SkinCategory[] = [
  "background",
  "indicator",
  "widget",
  "drawing",
];

// 구현된(status='available') 스킨이 1개라도 있는 카테고리는 펼친 채로 시작.
const DEFAULT_OPEN = CATEGORY_ORDER.reduce(
  (acc, c) => ({
    ...acc,
    [c]: SKINS_BY_CATEGORY[c].some((s) => s.status === "available"),
  }),
  {} as Record<SkinCategory, boolean>,
);

interface SkinSidebarProps {
  /** 접힘 여부 (AppShell이 소유) */
  collapsed: boolean;
  /** 접기/펼치기 토글 */
  onToggle: () => void;
}

/**
 * 마켓플레이스 사이드바 (VSCode 익스텐션 패널 스타일).
 * 카테고리별 접이식 섹션 → 스킨 카드 목록 → 적용/해제.
 * 배경·지표는 실제 적용 동작, 위젯은 준비중(자리).
 * 접힌 상태에서는 얇은 세로 레일만 남고, 펼치기 버튼이 보인다.
 */
export default function SkinSidebar({ collapsed, onToggle }: SkinSidebarProps) {
  const [open, setOpen] = useState<Record<SkinCategory, boolean>>(DEFAULT_OPEN);

  const backgroundSkinId = useSkinStore((s) => s.backgroundSkinId);
  const indicatorSkinId = useSkinStore((s) => s.indicatorSkinId);
  const crossStyle = useSkinStore((s) => s.crossStyle);
  const brickStyle = useSkinStore((s) => s.brickStyle);
  const catEnabled = useSkinStore((s) => s.catEnabled);
  const fireEnabled = useSkinStore((s) => s.fireEnabled);
  const waterfallEnabled = useSkinStore((s) => s.waterfallEnabled);
  const applyBackground = useSkinStore((s) => s.applyBackground);
  const removeBackground = useSkinStore((s) => s.removeBackground);
  const setBackgroundOpacity = useSkinStore((s) => s.setBackgroundOpacity);
  const applyIndicator = useSkinStore((s) => s.applyIndicator);
  const removeIndicator = useSkinStore((s) => s.removeIndicator);
  const setCrossStyle = useSkinStore((s) => s.setCrossStyle);
  const setBrickStyle = useSkinStore((s) => s.setBrickStyle);
  const toggleCat = useSkinStore((s) => s.toggleCat);
  const toggleFire = useSkinStore((s) => s.toggleFire);
  const toggleWaterfall = useSkinStore((s) => s.toggleWaterfall);
  const kiyoungiEnabled = useSkinStore((s) => s.kiyoungiEnabled);
  const toggleKiyoungi = useSkinStore((s) => s.toggleKiyoungi);
  const newsMarkersEnabled = useSkinStore((s) => s.newsMarkersEnabled);
  const toggleNewsMarkers = useSkinStore((s) => s.toggleNewsMarkers);
  const jigeumianiEnabled = useSkinStore((s) => s.jigeumianiEnabled);
  const toggleJigeumiani = useSkinStore((s) => s.toggleJigeumiani);
  const keycapEnabled = useSkinStore((s) => s.keycapEnabled);
  const toggleKeycap = useSkinStore((s) => s.toggleKeycap);
  const activeIndicators = useChartStore((s) => s.activeIndicators);
  const toggleIndicator = useChartStore((s) => s.toggleIndicator);

  const lineDrawMode = useSkinStore((s) => s.lineDrawMode);
  const setLineDrawMode = useSkinStore((s) => s.setLineDrawMode);
  const setLineDrawPendingStyle = useSkinStore((s) => s.setLineDrawPendingStyle);


  const stickerCount = useStickerStore((s) => s.stickers.length);
  const addSticker = useStickerStore((s) => s.addSticker);
  const clearStickers = useStickerStore((s) => s.clearStickers);

  const customItems = useCustomBgStore((s) => s.items);
  const loadCustom = useCustomBgStore((s) => s.load);
  const removeCustom = useCustomBgStore((s) => s.remove);

  // 마운트 시 IndexedDB → 업로드 배경 목록 1회 로드.
  useEffect(() => {
    loadCustom().catch(() => {});
  }, [loadCustom]);

  // 커스텀 배경을 SkinCard가 받는 BackgroundSkin 형태로 변환.
  const customSkins: BackgroundSkin[] = customItems.map((item) => ({
    id: item.id,
    name: item.name,
    author: "내 사진",
    description: "직접 올린 배경 사진",
    category: "background",
    status: "available",
    thumbnail: item.objectUrl,
    image: item.objectUrl,
    defaultFit: item.fit,
  }));

  // 적용중인 사진을 삭제하면 배경도 함께 해제.
  const handleDeleteCustom = (id: string) => {
    if (backgroundSkinId === id) removeBackground();
    removeCustom(id).catch(() => {});
  };

  const toggleSection = (c: SkinCategory) =>
    setOpen((o) => ({ ...o, [c]: !o[c] }));

  // 접힌 상태: 얇은 세로 레일 + 펼치기 버튼 (항상 마운트되어 상태 유지)
  if (collapsed) {
    return (
      <aside className="flex w-10 shrink-0 flex-col items-center border-l border-panel-border bg-panel py-2 transition-[width]">
        <button
          onClick={onToggle}
          title="마켓플레이스 펼치기"
          aria-label="마켓플레이스 펼치기"
          className="flex h-8 w-8 items-center justify-center rounded text-text-muted hover:bg-panel-hover hover:text-text-primary"
        >
          <PanelToggleIcon dir="left" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      data-onboarding="skin"
      className="flex w-[300px] shrink-0 flex-col border-l border-panel-border bg-panel transition-[width]"
    >
      <header className="flex items-center justify-between border-b border-panel-border px-3 py-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-primary">
          마켓플레이스
        </h2>
        <button
          onClick={onToggle}
          title="마켓플레이스 접기"
          aria-label="마켓플레이스 접기"
          className="flex h-6 w-6 items-center justify-center rounded text-text-muted hover:bg-panel-hover hover:text-text-primary"
        >
          <PanelToggleIcon dir="right" />
        </button>
      </header>

      <div className="thin-scroll flex-1 overflow-y-auto">
        {CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_META[category];
          const skins =
            category === "background"
              ? [...SKINS_BY_CATEGORY[category], ...customSkins]
              : SKINS_BY_CATEGORY[category];
          const isOpen = open[category];

          // 스킨 카드 1장 렌더 (적용 상태 판정 + 적용/해제 핸들러 바인딩).
          const renderCard = (skin: Skin) => {
            // 바인딩 연출 스킨(크로스/벽돌)은 skinStore 스타일 토글로 처리.
            const cross = CROSS_SKIN_STYLE[skin.id];
            const brick = BRICK_SKIN_STYLE[skin.id];
            // 부적 스티커는 토글이 아니라 인스턴스 추가 → 항상 "적용"(붙이기) 버튼.
            const stickerImg = STICKER_IMAGE[skin.id];

            const applied =
              (category === "background" && backgroundSkinId === skin.id) ||
              (category === "indicator" &&
                !cross &&
                !brick &&
                indicatorSkinId === skin.id) ||
              (!!cross && crossStyle === cross) ||
              (!!brick && brickStyle === brick) ||
              (category === "widget" &&
                skin.id === "wg-running-cat" &&
                catEnabled) ||
              (category === "widget" && skin.id === "wg-fire" && fireEnabled) ||
              (category === "widget" &&
                skin.id === "wg-waterfall" &&
                waterfallEnabled) ||
              (skin.id === "wg-kiyoungi" && kiyoungiEnabled) ||
              (category === "widget" &&
                skin.id === "wg-news-marker" &&
                newsMarkersEnabled) ||
              (category === "widget" &&
                skin.id === "wg-jigeumiani" &&
                jigeumianiEnabled) ||
              (category === "widget" &&
                skin.id === "wg-keycap" &&
                keycapEnabled) ||
              (skin.id === "ind-ichimoku-cloud" &&
                activeIndicators.includes("ichimoku"));

            return (
              <div key={skin.id}>
                <SkinCard
                  skin={skin}
                  applied={applied}
                  onApply={() => {
                    if (category === "background") {
                      applyBackground(skin.id);
                      const bg = skin as import("./presets").BackgroundSkin;
                      if (bg.defaultOpacity !== undefined) setBackgroundOpacity(bg.defaultOpacity);
                    }
                    else if (cross) setCrossStyle(cross);
                    else if (brick) setBrickStyle(brick);
                    else if (skin.id === "ind-ichimoku-cloud") toggleIndicator("ichimoku");
                    else if (stickerImg) addSticker(stickerImg);
                    else if (category === "indicator") applyIndicator(skin.id);
                    else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                    else if (category === "widget" && skin.id === "wg-fire") toggleFire();
                    else if (category === "widget" && skin.id === "wg-waterfall") toggleWaterfall();
                    else if (skin.id === "wg-kiyoungi") toggleKiyoungi();
                    else if (category === "widget" && skin.id === "wg-news-marker") toggleNewsMarkers();
                    else if (category === "widget" && skin.id === "wg-jigeumiani") toggleJigeumiani();
                    else if (category === "widget" && skin.id === "wg-keycap") toggleKeycap();
                  }}
                  onRemove={() => {
                    if (category === "background") removeBackground();
                    else if (cross) setCrossStyle(cross);
                    else if (brick) setBrickStyle(brick);
                    else if (skin.id === "ind-ichimoku-cloud") toggleIndicator("ichimoku");
                    else if (category === "indicator") removeIndicator();
                    else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                    else if (category === "widget" && skin.id === "wg-fire") toggleFire();
                    else if (category === "widget" && skin.id === "wg-waterfall") toggleWaterfall();
                    else if (skin.id === "wg-kiyoungi") toggleKiyoungi();
                    else if (category === "widget" && skin.id === "wg-news-marker") toggleNewsMarkers();
                    else if (category === "widget" && skin.id === "wg-jigeumiani") toggleJigeumiani();
                    else if (category === "widget" && skin.id === "wg-keycap") toggleKeycap();
                  }}
                  isSticker={!!stickerImg}
                  onDelete={
                    skin.id.startsWith("custom-")
                      ? () => handleDeleteCustom(skin.id)
                      : stickerImg && stickerCount > 0
                        ? () => clearStickers()
                        : undefined
                  }
                />
                {skin.id === "wg-fire" && <FireControls />}
                {skin.id === "wg-waterfall" && <WaterfallControls />}
                {skin.id === "ind-brick-pixel" && (
                  <BrickControls style="pixel" />
                )}
                {skin.id === "ind-brick-gold" && (
                  <BrickControls style="gold" />
                )}
              </div>
            );
          };

          return (
            <section
              key={category}
              className="border-t border-panel-border first:border-t-0 last-of-type:border-b-0"
            >
              <button
                onClick={() => toggleSection(category)}
                style={{ borderLeftColor: meta.accent }}
                className={`flex w-full items-center gap-2 border-l-[3px] px-3 py-2.5 text-left transition-colors hover:bg-panel-hover ${
                  isOpen ? "bg-panel-hover" : "bg-panel-alt"
                }`}
              >
                <span className="text-[10px] text-text-muted">
                  {isOpen ? "▾" : "▸"}
                </span>
                <span
                  style={{
                    backgroundColor: `${meta.accent}26`,
                    color: meta.accent,
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-sm"
                >
                  {meta.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-text-primary">
                  {meta.label}
                </span>
                <span
                  style={{
                    backgroundColor: `${meta.accent}26`,
                    color: meta.accent,
                  }}
                  className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums"
                >
                  {skins.length}
                </span>
              </button>

              {isOpen && (
                <div
                  style={{ borderLeftColor: "rgba(255,255,255,0.55)" }}
                  className="border-l-[3px] pb-1"
                >
                  {category === "background" && (
                    <>
                      <BackgroundControls />
                      <CustomBgUpload />
                    </>
                  )}
                  {category === "drawing" && (
                    <div className="mb-1 border-b border-panel-border px-3 pb-3 pt-2.5">
                      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                        <span>✏️</span>
                        <span>라인 그리기</span>
                      </div>
                      <p className="mb-2 text-[10px] text-text-muted">
                        스타일 선택 후 차트 드래그
                      </p>
                      <LineStylePicker
                        onSelect={(styleId) => {
                          setLineDrawPendingStyle(styleId);
                          setLineDrawMode("drawing");
                        }}
                      />

                      {lineDrawMode === "drawing" && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-accent">
                            ✏️ 그리는 중… 차트 드래그
                          </span>
                          <button
                            onClick={() => {
                              setLineDrawMode("idle");
                              setLineDrawPendingStyle(null);
                            }}
                            className="rounded bg-panel-hover px-2 py-0.5 text-[10px] text-text-muted hover:text-text-primary"
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {category === "indicator"
                    ? // 지표 스킨은 연동 지표(binding)별 서브그룹으로 구분 표시.
                      INDICATOR_BINDING_ORDER.map((binding) => {
                        const groupSkins = skins.filter(
                          (s) => s.binding === binding,
                        );
                        if (groupSkins.length === 0) return null;
                        const bm = INDICATOR_BINDING_META[binding];

                        return (
                          <div key={binding} className="mt-1.5 first:mt-0.5">
                            <div
                              title={bm.hint}
                              style={{ borderLeftColor: bm.accent }}
                              className="flex items-center gap-1.5 border-l-2 px-2.5 pb-1 pt-2"
                            >
                              <span
                                style={{
                                  backgroundColor: `${bm.accent}26`,
                                  color: bm.accent,
                                }}
                                className="flex h-5 w-5 items-center justify-center rounded text-[11px]"
                              >
                                {bm.icon}
                              </span>
                              <span
                                style={{ color: bm.accent }}
                                className="text-[10px] font-bold uppercase tracking-wide"
                              >
                                {bm.label}
                              </span>
                              <span
                                style={{
                                  backgroundColor: `${bm.accent}26`,
                                  color: bm.accent,
                                }}
                                className="ml-auto rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums"
                              >
                                {groupSkins.length}
                              </span>
                            </div>
                            <div
                              style={{ borderLeftColor: `${bm.accent}40` }}
                              className="border-l-2"
                            >
                              {groupSkins.map(renderCard)}
                            </div>
                          </div>
                        );
                      })
                    : skins.map(renderCard)}
                </div>
              )}
            </section>
          );
        })}

      </div>

      <footer className="border-t border-panel-border px-3 py-2 text-[10px] leading-tight text-text-muted">
        위젯은 준비중입니다. 배경·지표 스킨을 적용해 보세요.
      </footer>
    </aside>
  );
}

/**
 * 사이드바 토글 아이콘 (VSCode "패널 토글" 룩).
 * 둥근 사각 패널 + 우측 분할 pane + 안쪽 화살표.
 * dir="right" = 접기(우측으로), dir="left" = 펼치기(좌측으로).
 */
function PanelToggleIcon({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <line x1="15" y1="4" x2="15" y2="20" />
      {dir === "right" ? (
        <polyline points="8 9 11 12 8 15" />
      ) : (
        <polyline points="11 9 8 12 11 15" />
      )}
    </svg>
  );
}
