import { addDays, daysBetween } from '@/shared/lib/date'

/** 꼭 포함할 장소 한도 (PRD 8.1). 비교 담기는 제한이 없고, 추천 요청으로 넘길 때만 자른다 */
export const MUST_VISIT_LIMIT = 10

/** 추천 기간 최대 일수: 3박 4일 (PRD 8.1) */
export const MAX_TRIP_DAYS = 4

/** 페이스별 하루 상한. 온보딩 취향 값이며 동행별 보정은 서버만 한다 (PRD 003-01) */
export const PACE_DAILY_CAP = { relaxed: 3, packed: 5 } as const
export type PaceKey = keyof typeof PACE_DAILY_CAP

/** 비교 담기 목록 → 추천 요청의 꼭 포함할 장소. 11곳부터는 5단계에서 바꿔 담는다 */
export function limitCompareForRecommend(ids: string[]) {
  return ids.slice(0, MUST_VISIT_LIMIT)
}

/** 여행 일수 (1박 2일이면 2) */
export function tripDayCount(start: string, end: string) {
  return daysBetween(start, end) + 1
}

/** 일정 용량 = 여행 일수 × 페이스 상한 */
export function courseCapacity(start: string, end: string, pace: PaceKey) {
  return tripDayCount(start, end) * PACE_DAILY_CAP[pace]
}

/** 꼭 포함할 장소가 일정 용량을 넘는지 */
export function exceedsCapacity(count: number, start: string, end: string, pace: PaceKey) {
  return count > courseCapacity(start, end, pace)
}

/** 하루 더 늘릴 수 있는지 (이미 3박 4일이면 불가) */
export function canExtendTrip(start: string, end: string) {
  return tripDayCount(start, end) < MAX_TRIP_DAYS
}

/** 여행 종료일을 하루 늘린 날짜 */
export function extendTripEnd(end: string) {
  return addDays(end, 1)
}
