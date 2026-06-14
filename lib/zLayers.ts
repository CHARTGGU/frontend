/**
 * 차트 합성 레이어 z-index 단일 정의.
 *
 * 모든 오버레이가 같은 컨테이너(`ChartView`)에 절대배치되므로 앞뒤는 z-index로 결정된다.
 * 값이 흩어지면 충돌·헷갈림 → 여기 한 곳에서 관리하고 각 컴포넌트는 이 상수를 import.
 *
 * 주의: 차트 캔들/거래량 canvas(z-index:3)는 lightweight-charts **내부** 기본값이라
 * 여기서 못 바꾼다. 다른 레이어를 캔들 앞/뒤로 두려면 3을 기준으로 값을 잡을 것.
 */
export const Z_LAYER = {
  /** 배경 스킨 — 맨 뒤. */
  background: 0,
  /** 불타는 효과 위젯 — 배경 위, 차트 캔들 아래. */
  fire: 0,
  /** (참고) lightweight-charts 캔들/거래량 canvas — 라이브러리 내부 고정값. */
  chart: 3,
  /** 지표 스킨 오버레이 — 캔들 위. */
  indicator: 5,
  /** 뛰어다니는 고양이 위젯 — 맨 앞. */
  cat: 6,
} as const;
