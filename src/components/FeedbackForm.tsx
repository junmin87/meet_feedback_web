'use client';

// 회의록 입력 폼.
// React Hook Form + zodResolver로 feedbackFormSchema를 연결하고,
// 제출 시 상위에서 내려준 mutation(텍스트 / 음성)의 mutate를 호출한다.
// 회의 유형·아젠다는 두 방식 공통이고, 회의록 부분만 방식에 따라 전환된다.

import { useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AUDIO_ACCEPT,
  AUDIO_MAX_SIZE_LABEL,
  feedbackFormSchema,
  type FeedbackFormState,
  type InputMode,
} from '@/lib/feedbackSchema';
import { useMeetingTypes } from '@/lib/useMeetingTypes';
import type { UseFeedbackResult } from '@/lib/useFeedback';
import type { UseFeedbackAudioResult } from '@/lib/useFeedbackAudio';

// 필드 라벨 공통 스타일.
const labelClass = 'text-sm font-medium text-zinc-700 dark:text-zinc-200';
// 입력 요소 공통 스타일.
const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-700';
// 필드별 검증 에러 스타일.
const fieldErrorClass = 'text-xs text-red-600 dark:text-red-400';
// 보조 설명 스타일.
const hintClass = 'text-xs text-zinc-500 dark:text-zinc-400';

// 입력 방식 토글 탭 하나의 스타일. 선택 여부에 따라 배경을 바꾼다.
function tabClass(isActive: boolean): string {
  return [
    'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
    isActive
      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
  ].join(' ');
}

// 파일 크기를 사람이 읽기 좋은 문자열로 바꾼다.
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function FeedbackForm({
  feedback,
  audioFeedback,
  inputMode,
  onInputModeChange,
}: {
  feedback: UseFeedbackResult; // 텍스트 채점 mutation
  audioFeedback: UseFeedbackAudioResult; // 음성 채점 mutation
  inputMode: InputMode; // 현재 입력 방식 (상위에서 관리)
  onInputModeChange: (mode: InputMode) => void;
}) {
  // 회의 유형 드롭다운 데이터.
  const {
    data: meetingTypes,
    isLoading: isMeetingTypesLoading,
    error: meetingTypesError,
  } = useMeetingTypes();

  // 파일 input은 값을 프로그램적으로 비울 수 있게 ref로 잡아둔다.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<FeedbackFormState>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      inputMode: 'text',
      meetingType: '',
      agenda: '',
      meetingNotes: '',
      file: null,
    },
  });

  // 선택된 오디오 파일. 파일명·크기 표시에 쓴다.
  const selectedFile = useWatch({ control, name: 'file' });

  // 검증을 통과하면 방식에 맞는 mutation을 실행한다.
  // 백엔드 계약에 없는 필드가 섞이지 않도록 필요한 값만 골라서 넘긴다.
  const onSubmit = handleSubmit((values) => {
    if (values.inputMode === 'text') {
      feedback.mutate({
        meetingType: values.meetingType,
        agenda: values.agenda,
        meetingNotes: values.meetingNotes,
      });
      return;
    }

    // 스키마에서 이미 파일 존재를 보장하지만, 타입 좁히기를 위해 한 번 더 확인한다.
    if (!values.file) return;
    audioFeedback.mutate({
      meetingType: values.meetingType,
      agenda: values.agenda,
      file: values.file,
    });
  });

  // 입력 방식 전환. 폼 값과 상위 상태를 함께 갱신하고, 반대쪽 필드 에러는 지운다.
  const handleModeChange = (mode: InputMode) => {
    if (mode === inputMode) return;
    setValue('inputMode', mode);
    clearErrors(['meetingNotes', 'file']);
    onInputModeChange(mode);
  };

  // 파일 선택 시 RHF 값으로 반영한다. (file input은 FileList를 주므로 첫 파일만 쓴다.)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setValue('file', file, { shouldValidate: Boolean(file) });
  };

  // 선택한 파일 비우기.
  const handleFileClear = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    setValue('file', null);
    clearErrors('file');
  };

  const isSubmitting = feedback.isPending || audioFeedback.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* 입력 방식 토글 */}
      <div className="flex flex-col gap-1.5">
        <span className={labelClass}>회의록 입력 방식</span>
        <div
          role="tablist"
          aria-label="회의록 입력 방식"
          className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'text'}
            disabled={isSubmitting}
            className={tabClass(inputMode === 'text')}
            onClick={() => handleModeChange('text')}
          >
            텍스트 입력
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'audio'}
            disabled={isSubmitting}
            className={tabClass(inputMode === 'audio')}
            onClick={() => handleModeChange('audio')}
          >
            음성 파일 업로드
          </button>
        </div>
      </div>

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

      {/* 회의록 — 텍스트 방식일 때만 노출한다. */}
      {inputMode === 'text' && (
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
      )}

      {/* 회의록 — 음성 방식일 때는 파일 업로드로 전환된다. */}
      {inputMode === 'audio' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="audioFile" className={labelClass}>
            회의 음성 파일
          </label>
          <input
            id="audioFile"
            type="file"
            ref={fileInputRef}
            accept={AUDIO_ACCEPT}
            disabled={isSubmitting}
            aria-invalid={errors.file ? true : undefined}
            onChange={handleFileChange}
            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:file:bg-zinc-100 dark:file:text-zinc-900`}
          />
          <p className={hintClass}>
            오디오 파일만 업로드할 수 있습니다. (최대 {AUDIO_MAX_SIZE_LABEL})
          </p>
          {/* 선택한 파일 정보와 비우기 버튼 */}
          {selectedFile && (
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="truncate">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </span>
              <button
                type="button"
                onClick={handleFileClear}
                disabled={isSubmitting}
                className="shrink-0 text-zinc-500 underline underline-offset-2 transition hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                선택 취소
              </button>
            </div>
          )}
          {errors.file && (
            <p className={fieldErrorClass}>{errors.file.message}</p>
          )}
        </div>
      )}

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
