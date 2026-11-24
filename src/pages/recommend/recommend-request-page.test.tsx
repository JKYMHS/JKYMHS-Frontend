import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { demoPreferences } from '@/mocks/data/member'
import { renderRoute } from '@/test/render-route'

/** mock 장소 id 12개 (꼭 포함할 장소 후보 4 + 검색 대상 8) */
const PLACE_IDS = [
  'f-jeongdong',
  'f-bitchorong',
  'f-itaewon',
  'a-gyeongbok',
  'a-namsan',
  'a-deoksu',
  'a-museum',
  's-cheonggye',
  'a-changdeok',
  'a-bukchon',
  'a-gwangjang',
  'a-seoulforest',
]

describe('추천 요청 5단계 (07)', () => {
  it('다음·이전으로 단계를 오가고 고른 값을 트레이에 모은다', async () => {
    const { router } = renderRoute('/recommend?step=1')
    expect(await screen.findByRole('heading', { name: '어디로 갈까요?' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '다음' }))
    expect(screen.getByRole('heading', { name: '언제 떠나세요?' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?step=2')
    expect(screen.getByText(/1박 2일/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '이전' }))
    expect(screen.getByRole('heading', { name: '어디로 갈까요?' })).toBeInTheDocument()
  })

  it('오는 날을 고르기 전에는 다음으로 갈 수 없다', async () => {
    renderRoute('/recommend?step=2')
    await userEvent.click(await screen.findByRole('gridcell', { name: /^28/ }))
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
    await userEvent.click(screen.getByRole('gridcell', { name: /^30/ }))
    expect(screen.getByRole('button', { name: '다음' })).toBeEnabled()
  })

  it('지역 구·군 칩을 끄고 켤 수 있다', async () => {
    renderRoute('/recommend?step=1')
    const chip = await screen.findByRole('button', { name: '중구' })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('다음 달·오늘로·달 고르기로 달력을 옮긴다 (이번 달 이전은 막힌다)', async () => {
    renderRoute('/recommend?step=2')
    expect(await screen.findByRole('grid', { name: '2026년 10월' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전 달' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: '다음 달' }))
    expect(screen.getByRole('grid', { name: '2026년 11월' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이전 달' })).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: /달 고르기/ }))
    await userEvent.click(screen.getByRole('button', { name: '12월' }))
    expect(screen.getByRole('grid', { name: '2026년 12월' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /연도 고르기/ }))
    await userEvent.click(screen.getByRole('option', { name: '2027년' }))
    // 1년 뒤(2027년 10월)까지만 고를 수 있다
    expect(screen.getByRole('grid', { name: '2027년 10월' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다음 달' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: '오늘로' }))
    expect(screen.getByRole('grid', { name: '2026년 10월' })).toBeInTheDocument()
  })

  it('현재 위치를 쓰면 주소로 바꿔 출발지로 고른다', async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: 37.56, longitude: 126.97 } } as GeolocationPosition),
    )
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } })
    renderRoute('/recommend?step=3')
    await userEvent.click(await screen.findByRole('button', { name: /현재 위치 사용하기/ }))
    const option = await screen.findByRole('option', { name: /서울 중구 세종대로 110 근처/ })
    expect(option).toHaveAttribute('aria-selected', 'true')
    vi.unstubAllGlobals()
  })

  it('위치 권한이 거부되면 안내한다', async () => {
    const getCurrentPosition = vi.fn((_: PositionCallback, fail: PositionErrorCallback) =>
      fail({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    )
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } })
    renderRoute('/recommend?step=3')
    await userEvent.click(await screen.findByRole('button', { name: /현재 위치 사용하기/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('위치 권한이 꺼져 있어요')
    vi.unstubAllGlobals()
  })

  it('지역 검색으로 시·도와 구·군을 거르고, +17로 나머지 구를 펼친다', async () => {
    renderRoute('/recommend?step=1')
    await userEvent.click(await screen.findByRole('button', { name: '구·군 17개 더 보기' }))
    expect(screen.getByRole('button', { name: '은평구' })).toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox', { name: '지역 이름으로 찾기' }), '서초')
    expect(screen.getByRole('button', { name: '서초구' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '은평구' })).not.toBeInTheDocument()
  })

  it('꼭 포함할 장소를 이름으로 찾아 담는다', async () => {
    renderRoute('/recommend?step=5')
    await userEvent.type(await screen.findByRole('textbox', { name: '장소 이름으로 추가' }), '남산')
    expect(screen.getByText('검색 결과')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: '남산서울타워 담기' }))
    expect(screen.getByRole('button', { name: '남산서울타워 빼기' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '장소 이름으로 추가' })).toHaveValue('')
  })

  it('꼭 포함할 장소는 10곳까지만 담기고, 넘기려 하면 안내한다 (PRD 8.1)', async () => {
    renderRoute('/recommend?step=5', { mustVisitIds: PLACE_IDS.slice(0, 10) })
    expect(await screen.findByText('10/10')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox', { name: '장소 이름으로 추가' }), '서울숲')
    await userEvent.click(screen.getByRole('checkbox', { name: '서울숲 담기' }))
    expect(screen.getByRole('alert')).toHaveTextContent('꼭 포함할 장소는 10개를 넘을 수 없어요')
    expect(screen.getByText('10/10')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '서울숲 빼기' })).not.toBeInTheDocument()

    // 하나 빼서 자리가 나면 안내가 사라지고 담을 수 있다
    await userEvent.click(screen.getByRole('button', { name: '정동야행 빼기' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: '서울숲 담기' }))
    expect(screen.getByRole('button', { name: '서울숲 빼기' })).toBeInTheDocument()
  })

  it('비교 장소에서 넘어오면 그 장소들로 채우고, 5단계 설명은 10곳이다', async () => {
    renderRoute('/recommend?step=5', { mustVisitIds: ['a-gyeongbok', 'f-itaewon', 'x-unknown'] })
    expect(await screen.findByText('최대 10곳', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '경복궁 빼기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이태원지구촌축제 빼기' })).toBeInTheDocument()
    expect(screen.getByText('2/10')).toBeInTheDocument()
  })
})

describe('일정 용량 초과 확인 (PRD 003-01)', () => {
  const requested = (router: ReturnType<typeof renderRoute>['router']) =>
    (router.state.location.state as { draft: { end: string; allowOverPace: boolean } }).draft

  afterEach(() => {
    demoPreferences.pace = 'packed'
  })

  it('용량 안이면 모달 없이 바로 추천을 요청한다', async () => {
    const { router } = renderRoute('/recommend?step=5')
    await userEvent.click(await screen.findByRole('button', { name: '코스 추천받기' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/recommend/r-demo'))
    expect(requested(router).allowOverPace).toBe(false)
  })

  it('용량을 넘으면 [코스 추천받기]에서 확인 모달을 띄운다', async () => {
    demoPreferences.pace = 'relaxed' // 1박 2일 × 3곳 = 6곳
    const { router } = renderRoute('/recommend?step=5', { mustVisitIds: PLACE_IDS.slice(0, 7) })
    await userEvent.click(await screen.findByRole('button', { name: '코스 추천받기' }))
    const dialog = screen.getByRole('dialog', { name: '다음 날로 넘길까요?' })
    expect(dialog).toHaveTextContent(
      '고른 장소 7곳이 1박 2일에 담기에는 많아요. 하루를 늘리면 여유 있게 나눠 드려요.',
    )
    expect(within(dialog).getByRole('button', { name: '하루 늘리기' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '이대로 짜기' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/recommend')
  })

  it('[하루 늘리기]는 종료일을 하루 늘려 요청한다', async () => {
    demoPreferences.pace = 'relaxed'
    const { router } = renderRoute('/recommend?step=5', { mustVisitIds: PLACE_IDS.slice(0, 7) })
    await userEvent.click(await screen.findByRole('button', { name: '코스 추천받기' }))
    await userEvent.click(screen.getByRole('button', { name: '하루 늘리기' }))
    expect(router.state.location.pathname).toBe('/recommend/r-demo')
    expect(requested(router)).toMatchObject({ end: '2026-10-26', allowOverPace: false })
  })

  it('하루 늘려도 넘으면 늘어난 기간으로 다시 묻는다', async () => {
    demoPreferences.pace = 'relaxed' // 2박 3일이어도 9곳
    const { router } = renderRoute('/recommend?step=5', { mustVisitIds: PLACE_IDS.slice(0, 10) })
    await userEvent.click(await screen.findByRole('button', { name: '코스 추천받기' }))
    await userEvent.click(screen.getByRole('button', { name: '하루 늘리기' }))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '고른 장소 10곳이 2박 3일에 담기에는 많아요',
    )
    expect(router.state.location.pathname).toBe('/recommend')

    await userEvent.click(screen.getByRole('button', { name: '하루 늘리기' }))
    expect(requested(router).end).toBe('2026-10-27') // 3박 4일 × 3곳 = 12곳
  })

  it('[이대로 짜기]는 기간을 그대로 두고 allowOverPace: true로 요청한다', async () => {
    demoPreferences.pace = 'relaxed'
    const { router } = renderRoute('/recommend?step=5', { mustVisitIds: PLACE_IDS.slice(0, 7) })
    await userEvent.click(await screen.findByRole('button', { name: '코스 추천받기' }))
    await userEvent.click(screen.getByRole('button', { name: '이대로 짜기' }))
    expect(router.state.location.pathname).toBe('/recommend/r-demo')
    expect(requested(router)).toMatchObject({ end: '2026-10-25', allowOverPace: true })
  })

  it('모달을 닫으면 5단계에 남아 장소를 고칠 수 있다', async () => {
    demoPreferences.pace = 'relaxed'
    const { router } = renderRoute('/recommend?step=5', { mustVisitIds: PLACE_IDS.slice(0, 7) })
    await userEvent.click(await screen.findByRole('button', { name: '코스 추천받기' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/recommend')
  })
})
