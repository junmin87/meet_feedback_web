// 백엔드(NestJS) REST API를 호출하는 레이어.
// 모든 요청은 여기의 공통 request 함수를 거쳐 응답 파싱과 에러 처리를 일관되게 처리한다.

import type { ApiResponse, FeedbackReport, MeetingType } from '@/types/feedback';

// API 기본 URL. 환경변수가 있으면 그 값을, 없으면 로컬 백엔드를 기본값으로 쓴다.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// 백엔드 에러 메시지를 하나의 문자열로 정규화한다.
// NestJS는 검증 실패 시 message를 문자열 배열로 주기도 하므로 배열이면 합쳐준다.
function normalizeErrorMessage(message: string | string[] | undefined): string {
  if (Array.isArray(message)) return message.join(', ');
  return message ?? '알 수 없는 오류가 발생했습니다.';
}

// 공통 요청 함수. 응답을 ApiResponse<T>로 파싱하고, 실패하면 Error를 throw한다.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // 헤더에 JSON 타입을 기본 지정하고, 호출부에서 넘긴 헤더를 덮어쓸 수 있게 병합한다.
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  // 응답 본문을 ApiResponse 형태로 파싱한다.
  const body = (await response.json()) as ApiResponse<T>;

  // HTTP 에러이거나 백엔드가 success: false를 준 경우, 에러 메시지를 담아 throw한다.
  if (!response.ok || !body.success) {
    throw new Error(normalizeErrorMessage(body.error?.message));
  }

  // 성공했지만 data가 없으면 계약 위반이므로 방어적으로 에러 처리한다.
  if (body.data === undefined) {
    throw new Error('응답에 데이터가 없습니다.');
  }

  return body.data;
}

// 회의 종류 목록 조회. GET /meeting-types
export function getMeetingTypes(): Promise<MeetingType[]> {
  return request<MeetingType[]>('/meeting-types');
}

// 회의록 피드백 생성 요청. POST /feedback
export function postFeedback(input: {
  meetingType: string; // 선택한 회의 종류 id
  agenda: string; // 회의 안건
  meetingNotes: string; // 회의록 원문
}): Promise<FeedbackReport> {
  return request<FeedbackReport>('/feedback', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
