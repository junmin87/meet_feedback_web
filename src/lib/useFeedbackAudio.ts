'use client';

// 음성 회의록 평가를 요청하는 React Query mutation 훅.
// 기존 useFeedback과 같은 패턴으로, useMutation 결과를 그대로 노출한다.

import { useMutation } from '@tanstack/react-query';
import { postFeedbackAudio } from '@/lib/api';
import type { AudioFeedbackValues } from '@/lib/feedbackSchema';

export function useFeedbackAudio() {
  return useMutation({
    mutationFn: (input: AudioFeedbackValues) => postFeedbackAudio(input),
  });
}

// 페이지에서 mutation 객체를 폼에 넘길 때 쓰는 타입.
export type UseFeedbackAudioResult = ReturnType<typeof useFeedbackAudio>;
