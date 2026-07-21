'use client';

// 회의록 입력 폼.
// React Hook Form + zodResolver로 feedbackSchema를 연결하고,
// 제출 시 상위에서 내려준 useFeedback mutation의 mutate를 호출한다.

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feedbackSchema, type FeedbackFormValues } from '@/lib/feedbackSchema';
import { useMeetingTypes } from '@/lib/useMeetingTypes';
import type { UseFeedbackResult } from '@/lib/useFeedback';

// 필드 라벨 공통 스타일.
const labelClass = 'text-sm font-medium text-zinc-700 dark:text-zinc-200';
// 입력 요소 공통 스타일.
const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-700';
// 필드별 검증 에러 스타일.
const fieldErrorClass = 'text-xs text-red-600 dark:text-red-400';

export default function FeedbackForm({
  feedback,
}: {
  feedback: UseFeedbackResult;
}) {
  // 회의 유형 드롭다운 데이터.
  const {
    data: meetingTypes,
    isLoading: isMeetingTypesLoading,
    error: meetingTypesError,
  } = useMeetingTypes();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      meetingType: '',
      agenda: '',
      meetingNotes: '',
    },
  });

  // 검증을 통과하면 mutation을 실행한다.
  const onSubmit = handleSubmit((values) => {
    feedback.mutate(values);
  });

  const isSubmitting = feedback.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* 회의 유형 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="meetingType" className={labelClass}>
          회의 유형
        </label>
        <select
          id="meetingType"
          className={inputClass}
          disabled={isSubmitting || isMeetingTypesLoading}
          aria-invalid={errors.meetingType ? true : undefined}
          {...register('meetingType')}
        >
          <option value="" disabled>
            {isMeetingTypesLoading
              ? '회의 유형을 불러오는 중…'
              : '회의 유형을 선택하세요'}
          </option>
          {meetingTypes?.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        {/* 목록 로딩 실패는 필드 에러와 구분해 별도로 안내한다. */}
        {meetingTypesError && (
          <p className={fieldErrorClass}>
            회의 유형을 불러오지 못했습니다: {meetingTypesError.message}
          </p>
        )}
        {errors.meetingType && (
          <p className={fieldErrorClass}>{errors.meetingType.message}</p>
        )}
      </div>

      {/* 아젠다 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="agenda" className={labelClass}>
          아젠다
        </label>
        <input
          id="agenda"
          type="text"
          className={inputClass}
          placeholder="이번 회의의 안건을 입력하세요"
          disabled={isSubmitting}
          aria-invalid={errors.agenda ? true : undefined}
          {...register('agenda')}
        />
        {errors.agenda && (
          <p className={fieldErrorClass}>{errors.agenda.message}</p>
        )}
      </div>

      {/* 회의록 */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="meetingNotes" className={labelClass}>
          회의록
        </label>
        <textarea
          id="meetingNotes"
          rows={12}
          className={`${inputClass} resize-y`}
          placeholder="회의록 원문을 붙여 넣으세요 (최소 10자)"
          disabled={isSubmitting}
          aria-invalid={errors.meetingNotes ? true : undefined}
          {...register('meetingNotes')}
        />
        {errors.meetingNotes && (
          <p className={fieldErrorClass}>{errors.meetingNotes.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {isSubmitting && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {isSubmitting ? '평가 중…' : '평가하기'}
      </button>
    </form>
  );
}
