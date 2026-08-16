'use client';

// 회의록 입력 화면.
// 폼을 보여주고, 평가에 성공하면 결과를, 실패하면 에러 메시지를 표시한다.
// mutation 인스턴스를 이 페이지에서 한 번만 만들어 폼과 결과/에러 표시가 같은 상태를 공유한다.
// 입력 방식(텍스트 / 음성)은 여기서 관리하고, 방식에 맞는 mutation의 상태만 화면에 반영한다.

import { useState } from 'react';
import { useFeedback } from '@/lib/useFeedback';
import { useFeedbackAudio } from '@/lib/useFeedbackAudio';
import { isRateLimitError } from '@/lib/api';
import type { InputMode } from '@/lib/feedbackSchema';
import FeedbackForm from '@/components/FeedbackForm';
import FeedbackResult from '@/components/FeedbackResult';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const feedback = useFeedback();
  const audioFeedback = useFeedbackAudio();

  // 현재 입력 방식에 해당하는 mutation. 결과·에러 표시는 이쪽 상태만 본다.
  const active = inputMode === 'text' ? feedback : audioFeedback;

  // 방식을 바꾸면 이전 방식의 결과·에러가 남지 않도록 둘 다 초기화한다.
  const handleInputModeChange = (mode: InputMode) => {
    setInputMode(mode);
    feedback.reset();
    audioFeedback.reset();
  };

  // 요청 제한(429)은 오류가 아니라 안내 톤으로 보여준다.
  const isRateLimited = isRateLimitError(active.error);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            회의록 코칭
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            회의 유형과 아젠다, 회의록(텍스트 또는 음성 파일)을 입력하면 루브릭
            기반으로 평가해 드립니다.
          </p>
        </header>

        <FeedbackForm
          feedback={feedback}
          audioFeedback={audioFeedback}
          inputMode={inputMode}
          onInputModeChange={handleInputModeChange}
        />

        {/* 평가 실패 시 표시. 429는 빨강 대신 안내색으로 구분한다. */}
        {active.isError && (
          <ErrorMessage
            variant={isRateLimited ? 'notice' : 'error'}
            message={active.error?.message ?? '평가 요청에 실패했습니다.'}
          />
        )}

        {/* 평가 성공 시 결과 표시 */}
        {active.isSuccess && <FeedbackResult report={active.data} />}
      </main>
    </div>
  );
}
