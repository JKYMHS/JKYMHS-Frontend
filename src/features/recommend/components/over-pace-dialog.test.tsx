import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverPaceDialog } from './over-pace-dialog'

function setup(canExtend: boolean) {
  const onExtend = vi.fn()
  const onKeep = vi.fn()
  render(
    <OverPaceDialog
      open
      onOpenChange={() => {}}
      count={8}
      periodLabel="2박 3일"
      canExtend={canExtend}
      onExtend={onExtend}
      onKeep={onKeep}
    />,
  )
  return { onExtend, onKeep }
}

describe('용량 초과 확인 모달 (PRD 003-01)', () => {
  it('제목·본문·두 버튼을 보여준다', async () => {
    const { onExtend, onKeep } = setup(true)
    expect(screen.getByRole('dialog', { name: '다음 날로 넘길까요?' })).toHaveTextContent(
      '고른 장소 8곳이 2박 3일에 담기에는 많아요. 하루를 늘리면 여유 있게 나눠 드려요.',
    )
    await userEvent.click(screen.getByRole('button', { name: '하루 늘리기' }))
    await userEvent.click(screen.getByRole('button', { name: '이대로 짜기' }))
    expect(onExtend).toHaveBeenCalledOnce()
    expect(onKeep).toHaveBeenCalledOnce()
  })

  it('이미 3박 4일이면 [하루 늘리기]를 보여주지 않는다', () => {
    setup(false)
    expect(screen.queryByRole('button', { name: '하루 늘리기' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이대로 짜기' })).toBeInTheDocument()
  })
})
