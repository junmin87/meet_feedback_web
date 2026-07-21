'use client';

// 회의록 입력 화면.
// 폼을 보여주고, 평가에 성공하면 결과를, 실패하면 에러 메시지를 표시한다.
// mutation 인스턴스를 이 페이지에서 한 번만 만들어 폼과 결과/에러 표시가 같은 상태를 공유한다.

import { useFeedback } from '@/lib/useFeedback';
import FeedbackForm from '@/components/FeedbackForm';
import FeedbackResult from '@/components/FeedbackResult';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
  const feedback = useFeedback();

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            회의록 코칭
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            회의 유형과 아젠다, 회의록을 입력하면 루브릭 기반으로 평가해 드립니다.
          </p>
        </header>

        <FeedbackForm feedback={feedback} />

        {/* 평가 실패 시 에러 표시 */}
        {feedback.isError && (
          <ErrorMessage
            message={feedback.error?.message ?? '평가 요청에 실패했습니다.'}
          />
        )}

        {/* 평가 성공 시 결과 표시 */}
        {feedback.isSuccess && <FeedbackResult report={feedback.data} />}
      </main>
    </div>
  );
}
