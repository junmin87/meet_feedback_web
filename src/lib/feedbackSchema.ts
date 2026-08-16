// 회의록 입력 폼의 검증 스키마.
// 백엔드(NestJS) 밸리데이션 규칙과 1:1로 맞춰, 프론트에서 먼저 걸러낸다.
// 입력 방식(텍스트 / 음성)에 따라 회의록 부분의 검증 규칙이 갈린다.

import { z } from 'zod';

// 회의록 입력 방식.
export type InputMode = 'text' | 'audio';

// 음성 파일 제약. 파일 선택 input의 accept 값과 크기 상한을 한곳에서 관리한다.
export const AUDIO_ACCEPT = 'audio/*';
export const AUDIO_MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
export const AUDIO_MAX_SIZE_LABEL = '25MB';

// 브라우저가 확장자에 따라 MIME 타입을 비워서 주는 경우가 있어(예: 일부 .m4a),
// MIME이 비어 있으면 확장자로 한 번 더 판단한다.
const AUDIO_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.wav',
  '.aac',
  '.ogg',
  '.oga',
  '.opus',
  '.flac',
  '.webm',
  '.mp4',
  '.amr',
  '.wma',
];

function isAudioFile(file: File): boolean {
  if (file.type) return file.type.startsWith('audio/');
  const name = file.name.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => name.endsWith(ext));
}

// 공통 필드 — 회의 유형과 아젠다는 두 방식이 그대로 공유한다.
const meetingTypeField = z.string().min(1, '회의 유형을 선택해 주세요.');
const agendaField = z
  .string()
  .min(1, '아젠다를 입력해 주세요.')
  .max(500, '아젠다는 500자 이하로 입력해 주세요.');

// 텍스트 방식의 회의록 원문: 10~20000자. (기존 규칙 그대로)
const meetingNotesField = z
  .string()
  .min(10, '회의록은 최소 10자 이상 입력해 주세요.')
  .max(20000, '회의록은 20,000자 이하로 입력해 주세요.');

// 음성 방식의 오디오 파일: 오디오 형식만, 최대 25MB.
const audioFileField = z
  .instanceof(File, { message: '음성 파일을 선택해 주세요.' })
  .refine((file) => file.size > 0, '빈 파일은 업로드할 수 없습니다.')
  .refine(isAudioFile, '오디오 파일만 업로드할 수 있습니다.')
  .refine(
    (file) => file.size <= AUDIO_MAX_SIZE_BYTES,
    `음성 파일은 ${AUDIO_MAX_SIZE_LABEL} 이하만 업로드할 수 있습니다.`,
  );

// 텍스트 채점 요청(POST /feedback)의 페이로드 스키마.
export const feedbackSchema = z.object({
  meetingType: meetingTypeField,
  agenda: agendaField,
  meetingNotes: meetingNotesField,
});

// 텍스트 채점 mutation 입력 타입.
export type FeedbackFormValues = z.infer<typeof feedbackSchema>;

// 음성 채점 요청(POST /feedback/audio)의 페이로드 스키마.
export const audioFeedbackSchema = z.object({
  meetingType: meetingTypeField,
  agenda: agendaField,
  file: audioFileField,
});

// 음성 채점 mutation 입력 타입.
export type AudioFeedbackValues = z.infer<typeof audioFeedbackSchema>;

// 폼 전체 상태의 스키마.
// 두 방식이 한 폼을 공유하므로 meetingNotes/file은 항상 존재하고,
// 실제 필수 여부는 inputMode에 따라 아래에서 분기 검증한다.
export const feedbackFormSchema = z
  .object({
    inputMode: z.enum(['text', 'audio']),
    meetingType: meetingTypeField,
    agenda: agendaField,
    meetingNotes: z.string(),
    file: z.custom<File | null>(),
  })
  .superRefine((values, ctx) => {
    if (values.inputMode === 'text') {
      // 텍스트 방식: 회의록 원문이 필수다.
      const result = meetingNotesField.safeParse(values.meetingNotes);
      if (!result.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['meetingNotes'],
          message: result.error.issues[0]?.message,
        });
      }
      return;
    }

    // 음성 방식: 오디오 파일이 필수다.
    const result = audioFileField.safeParse(values.file);
    if (!result.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['file'],
        message: result.error.issues[0]?.message,
      });
    }
  });

// 폼(React Hook Form)이 다루는 값의 타입.
export type FeedbackFormState = z.infer<typeof feedbackFormSchema>;
