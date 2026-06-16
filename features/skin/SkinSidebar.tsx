"use client";

import { useEffect, useState } from "react";
import { useSkinStore } from "@/stores/skinStore";
import { useCustomBgStore } from "@/stores/customBgStore";
import { useChartStore } from "@/stores/chartStore";
import BackgroundControls from "./BackgroundControls";
import CustomBgUpload from "./CustomBgUpload";
import FireControls from "./FireControls";
import WaterfallControls from "./WaterfallControls";
import SkinCard from "./SkinCard";
import {
  BRICK_SKIN_STYLE,
  CATEGORY_META,
  CROSS_SKIN_STYLE,
  INDICATOR_BINDING_META,
  INDICATOR_BINDING_ORDER,
  SKINS_BY_CATEGORY,
  type BackgroundSkin,
  type Skin,
  type SkinCategory,
} from "./presets";

const CATEGORY_ORDER: SkinCategory[] = [
  "background",
  "indicator",
  "widget",
  "set",
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
 * 배경·지표는 실제 적용 동작, 위젯·세트는 준비중(자리).
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
  const activeIndicators = useChartStore((s) => s.activeIndicators);
  const toggleIndicator = useChartStore((s) => s.toggleIndicator);

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
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-panel-border bg-panel transition-[width]">
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
              (category === "widget" &&
                skin.id === "wg-kiyoungi" &&
                kiyoungiEnabled) ||
              (category === "widget" &&
                skin.id === "wg-news-marker" &&
                newsMarkersEnabled) ||
              (skin.id === "ind-ichimoku-cloud" &&
                activeIndicators.includes("ichimoku"));

            return (
              <div key={skin.id}>
                <SkinCard
                  skin={skin}
                  applied={applied}
                  onApply={() => {
                    if (category === "background") applyBackground(skin.id);
                    else if (cross) setCrossStyle(cross);
                    else if (brick) setBrickStyle(brick);
                    else if (skin.id === "ind-ichimoku-cloud") toggleIndicator("ichimoku");
                    else if (category === "indicator") applyIndicator(skin.id);
                    else if (category === "widget" && skin.id === "wg-running-cat") toggleCat();
                    else if (category === "widget" && skin.id === "wg-fire") toggleFire();
                    else if (category === "widget" && skin.id === "wg-waterfall") toggleWaterfall();
                    else if (category === "widget" && skin.id === "wg-kiyoungi") toggleKiyoungi();
                    else if (category === "widget" && skin.id === "wg-news-marker") toggleNewsMarkers();
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
                    else if (category === "widget" && skin.id === "wg-kiyoungi") toggleKiyoungi();
                    else if (category === "widget" && skin.id === "wg-news-marker") toggleNewsMarkers();
                  }}
                  onDelete={
                    skin.id.startsWith("custom-")
                      ? () => handleDeleteCustom(skin.id)
                      : undefined
                  }
                />
                {skin.id === "wg-fire" && <FireControls />}
                {skin.id === "wg-waterfall" && <WaterfallControls />}
              </div>
            );
          };

          return (
            <section key={category}>
              <button
                onClick={() => toggleSection(category)}
                className="flex w-full items-center gap-1.5 bg-panel-alt px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-wide text-text-primary hover:bg-panel-hover"
              >
                <span className="text-text-muted">{isOpen ? "▾" : "▸"}</span>
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="ml-auto text-text-muted">{skins.length}</span>
              </button>

              {isOpen && (
                <div>
                  {category === "background" && (
                    <>
                      <BackgroundControls />
                      <CustomBgUpload />
                    </>
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
                          <div key={binding}>
                            <div
                              title={bm.hint}
                              className="flex items-center gap-1.5 px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted"
                            >
                              <span>{bm.icon}</span>
                              <span>{bm.label}</span>
                              <span className="ml-auto">
                                {groupSkins.length}
                              </span>
                            </div>
                            {groupSkins.map(renderCard)}
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
        위젯·세트 테마는 준비중입니다. 배경·지표 스킨을 적용해 보세요.
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
