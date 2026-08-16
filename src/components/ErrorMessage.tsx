// 에러 메시지를 보기 좋게 표시하는 재사용 컴포넌트.
// variant로 톤을 구분한다. 'error'는 빨강(실제 오류),
// 'notice'는 노랑(요청 제한처럼 사용자가 잠시 후 재시도하면 되는 안내).

type MessageVariant = 'error' | 'notice';

const variantClass: Record<MessageVariant, string> = {
  error:
    'border-red-300 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
  notice:
    'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
};

export default function ErrorMessage({
  message,
  variant = 'error',
}: {
  message: string;
  variant?: MessageVariant;
}) {
  return (
    <div
      // 안내 톤은 경고음처럼 읽히지 않도록 role도 status로 낮춘다.
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${variantClass[variant]}`}
    >
      {message}
    </div>
  );
}
