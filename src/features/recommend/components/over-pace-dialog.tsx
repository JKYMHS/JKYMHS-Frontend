import { Button, Modal } from '@/shared/ui'

/**
 * 꼭 포함할 장소가 일정 용량을 넘을 때 확인 모달 (PRD 003-01).
 * 5단계 [코스 추천받기]와 서버의 용량 초과 응답이 같은 모달을 쓴다.
 */
export function OverPaceDialog({
  open,
  onOpenChange,
  count,
  periodLabel,
  canExtend,
  onExtend,
  onKeep,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 꼭 포함할 장소 수 */
  count: number
  /** "1박 2일" 같은 현재 기간 */
  periodLabel: string
  /** 이미 3박 4일이면 [하루 늘리기]를 보여주지 않는다 */
  canExtend: boolean
  onExtend: () => void
  onKeep: () => void
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="다음 날로 넘길까요?"
      description={`고른 장소 ${count}곳이 ${periodLabel}에 담기에는 많아요. 하루를 늘리면 여유 있게 나눠 드려요.`}
      className="w-[440px] gap-[18px] rounded-[20px]"
    >
      <div className="flex justify-end gap-2 pt-1">
        {canExtend && (
          <Button variant="secondary" onClick={onExtend}>
            하루 늘리기
          </Button>
        )}
        <Button onClick={onKeep}>이대로 짜기</Button>
      </div>
    </Modal>
  )
}
