// 백엔드(NestJS) REST API를 호출하는 레이어.
// 모든 요청은 여기의 공통 request 함수를 거쳐 응답 파싱과 에러 처리를 일관되게 처리한다.

import type { ApiResponse, FeedbackReport, MeetingType } from '@/types/feedback';

// API 기본 URL. 환경변수가 있으면 그 값을, 없으면 로컬 백엔드를 기본값으로 쓴다.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

// 429(요청 제한)일 때 백엔드가 메시지를 주지 않은 경우에만 쓰는 기본 문구.
// 백엔드 메시지에는 실제 제한값이 담겨 있으므로, 있으면 그쪽을 우선한다.
export const RATE_LIMIT_FALLBACK_MESSAGE =
  '요청이 너무 많습니다. 3분에 2회까지 가능합니다. 잠시 후 다시 시도해 주세요.';

// 백엔드 에러를 담는 커스텀 에러.
// 상태 코드를 함께 들고 있어, 표시 쪽에서 429 같은 특정 상황을 구분할 수 있다.
export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }

  // 요청 제한(rate limit) 초과 여부.
  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }
}

// 임의의 에러 값이 요청 제한 에러인지 판별한다. (컴포넌트가 표시 톤을 고를 때 쓴다.)
export function isRateLimitError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.isRateLimited;
}

// 백엔드 에러 메시지를 하나의 문자열로 정규화한다.
// NestJS는 검증 실패 시 message를 문자열 배열로 주기도 하므로 배열이면 합쳐준다.
function normalizeErrorMessage(
  message: string | string[] | undefined,
  statusCode?: number,
): string {
  const joined = Array.isArray(message) ? message.join(', ') : message;
  if (joined && joined.trim().length > 0) return joined;

  // 여기부터는 백엔드가 메시지를 주지 않은 경우의 기본 문구다.
  if (statusCode === 429) return RATE_LIMIT_FALLBACK_MESSAGE;
  return '알 수 없는 오류가 발생했습니다.';
}

// 응답을 ApiResponse<T> 계약대로 파싱한다. 실패하면 ApiError를 throw한다.
// JSON/multipart 요청이 모두 이 함수를 공유해 같은 계약으로 처리된다.
async function parseResponse<T>(response: Response): Promise<T> {
  // 게이트웨이·프록시가 JSON이 아닌 본문을 주는 경우가 있어 방어적으로 파싱한다.
  let body: ApiResponse<T> | undefined;
  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch {
    body = undefined;
  }

  // HTTP 에러이거나 백엔드가 success: false를 준 경우, 에러 메시지를 담아 throw한다.
  if (!response.ok || !body?.success) {
    // 상태 코드는 본문의 statusCode를 우선하고, 없으면 HTTP 상태를 쓴다.
    const statusCode = body?.error?.statusCode ?? response.status;
    throw new ApiError(
      normalizeErrorMessage(body?.error?.message, statusCode),
      statusCode,
    );
  }

  // 성공했지만 data가 없으면 계약 위반이므로 방어적으로 에러 처리한다.
  if (body.data === undefined) {
    throw new ApiError('응답에 데이터가 없습니다.', response.status);
  }

  return body.data;
}

// 공통 요청 함수. 응답을 ApiResponse<T>로 파싱하고, 실패하면 ApiError를 throw한다.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // 헤더에 JSON 타입을 기본 지정하고, 호출부에서 넘긴 헤더를 덮어쓸 수 있게 병합한다.
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  return parseResponse<T>(response);
}

// multipart/form-data 전용 요청 함수.
// Content-Type을 직접 지정하지 않아야 브라우저가 boundary를 포함해 자동으로 붙여준다.
async function requestMultipart<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });

  return parseResponse<T>(response);
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

// 음성 회의록 피드백 생성 요청. POST /feedback/audio (multipart/form-data)
export function postFeedbackAudio(input: {
  meetingType: string; // 선택한 회의 종류 id
  agenda: string; // 회의 안건
  file: File; // 업로드할 오디오 파일
}): Promise<FeedbackReport> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('meetingType', input.meetingType);
  formData.append('agenda', input.agenda);

  return requestMultipart<FeedbackReport>('/feedback/audio', formData);
}
