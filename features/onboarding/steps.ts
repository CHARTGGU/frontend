/**
 * 온보딩 단계 정의 (배열 순서 = 진행 순서).
 * 각 단계의 타깃은 기존 컴포넌트에 부착된 data-onboarding="<id>" 요소.
 */
export interface OnboardingStep {
  /** 타깃 식별자 — DOM의 data-onboarding 값과 일치. */
  id: string;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "symbol",
    title: "종목 선택",
    description: "보고 싶은 코인을 여기서 골라보세요.",
  },
  {
    id: "indicator",
    title: "지표 추가",
    description: "MA·볼린저밴드·RSI 같은 보조지표를 켜고 끌 수 있어요.",
  },
  {
    id: "skin",
    title: "스킨 적용",
    description: "차트에 배경·캐릭터 스킨을 입혀 나만의 뷰를 만들어요.",
  },
  {
    id: "export",
    title: "이미지 저장",
    description: "꾸민 차트를 PNG 한 장으로 내보낼 수 있어요.",
  },
];

/** data-onboarding 셀렉터 헬퍼. */
export const onboardingSelector = (id: string) => `[data-onboarding="${id}"]`;
