'use client';

// 회의록 평가를 요청하는 React Query mutation 훅.
// mutate/isPending/isError/error/data/reset 등 useMutation 결과를 그대로 노출해
// 폼과 페이지가 필요한 값을 골라 쓰게 한다.

import { useMutation } from '@tanstack/react-query';
import { postFeedback } from '@/lib/api';
import type { FeedbackFormValues } from '@/lib/feedbackSchema';

export function useFeedback() {
  return useMutation({
    mutationFn: (input: FeedbackFormValues) => postFeedback(input),
  });
}

// 페이지에서 mutation 객체를 폼에 넘길 때 쓰는 타입.
export type UseFeedbackResult = ReturnType<typeof useFeedback>;
