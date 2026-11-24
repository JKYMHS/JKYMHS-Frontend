import {
  MUST_VISIT_LIMIT,
  canExtendTrip,
  courseCapacity,
  exceedsCapacity,
  extendTripEnd,
  limitCompareForRecommend,
  tripDayCount,
} from './capacity'

describe('꼭 포함할 장소 한도 (PRD 8.1)', () => {
  it('최대 10곳이다', () => {
    expect(MUST_VISIT_LIMIT).toBe(10)
  })

  it('비교 장소가 11개 이상이면 처음 10개만 넘긴다', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `p${i + 1}`)
    expect(limitCompareForRecommend(ids)).toEqual(ids.slice(0, 10))
  })

  it('10개 이하면 그대로 넘긴다', () => {
    expect(limitCompareForRecommend(['a', 'b'])).toEqual(['a', 'b'])
    expect(limitCompareForRecommend([])).toEqual([])
  })
})

describe('일정 용량 = 여행 일수 × 페이스 상한 (PRD 003-01)', () => {
  it('여행 일수는 박 수 + 1이다', () => {
    expect(tripDayCount('2026-10-24', '2026-10-24')).toBe(1)
    expect(tripDayCount('2026-10-24', '2026-10-25')).toBe(2)
    expect(tripDayCount('2026-10-24', '2026-10-27')).toBe(4)
  })

  it('여유롭게는 하루 3곳, 알차게는 하루 5곳이다', () => {
    expect(courseCapacity('2026-10-24', '2026-10-25', 'relaxed')).toBe(6)
    expect(courseCapacity('2026-10-24', '2026-10-25', 'packed')).toBe(10)
  })

  it('용량과 같으면 넘지 않고, 하나 많으면 넘는다', () => {
    expect(exceedsCapacity(6, '2026-10-24', '2026-10-25', 'relaxed')).toBe(false)
    expect(exceedsCapacity(7, '2026-10-24', '2026-10-25', 'relaxed')).toBe(true)
    expect(exceedsCapacity(5, '2026-10-24', '2026-10-24', 'packed')).toBe(false)
    expect(exceedsCapacity(6, '2026-10-24', '2026-10-24', 'packed')).toBe(true)
  })
})

describe('하루 늘리기', () => {
  it('3박 4일보다 짧으면 늘릴 수 있다', () => {
    expect(canExtendTrip('2026-10-24', '2026-10-24')).toBe(true)
    expect(canExtendTrip('2026-10-24', '2026-10-26')).toBe(true)
  })

  it('이미 3박 4일이면 늘릴 수 없다', () => {
    expect(canExtendTrip('2026-10-24', '2026-10-27')).toBe(false)
  })

  it('종료일을 하루 뒤로 옮기고 달이 바뀌어도 맞다', () => {
    expect(extendTripEnd('2026-10-25')).toBe('2026-10-26')
    expect(extendTripEnd('2026-10-31')).toBe('2026-11-01')
  })
})
