// 회의록 입력 폼의 검증 스키마.
// 백엔드(NestJS) 밸리데이션 규칙과 1:1로 맞춰, 프론트에서 먼저 걸러낸다.

import { z } from 'zod';

// 입력 필드별 검증 규칙. 각 규칙에는 사용자에게 보여줄 한국어 메시지를 붙인다.
export const feedbackSchema = z.object({
  // 회의 유형: 드롭다운에서 선택한 회의 종류 id. 비어 있으면 안 된다.
  meetingType: z.string().min(1, '회의 유형을 선택해 주세요.'),
  // 아젠다: 1~500자.
  agenda: z
    .string()
    .min(1, '아젠다를 입력해 주세요.')
    .max(500, '아젠다는 500자 이하로 입력해 주세요.'),
  // 회의록 원문: 10~20000자.
  meetingNotes: z
    .string()
    .min(10, '회의록은 최소 10자 이상 입력해 주세요.')
    .max(20000, '회의록은 20,000자 이하로 입력해 주세요.'),
});

// 폼에서 다루는 값의 타입. RHF와 mutation 입력에 공유한다.
export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
