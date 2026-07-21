// 백엔드(NestJS)의 API 응답 형태와 1:1로 맞춘 타입 정의 모음.
// 프론트엔드 전역에서 이 타입들을 공유해 서버-클라이언트 간 데이터 계약을 일치시킨다.

// 회의 종류. 백엔드가 제공하는 선택 가능한 회의 유형 하나를 나타낸다.
export interface MeetingType {
  id: string; // 회의 종류 식별자
  label: string; // 사용자에게 보여줄 이름
  description: string; // 회의 종류에 대한 설명
}

// 루브릭(평가 기준) 항목 하나의 채점 결과.
export interface RubricScoreItem {
  id: string; // 평가 항목 식별자
  label: string; // 평가 항목 이름
  score: number; // 획득 점수
  maxScore: number; // 해당 항목의 만점
  feedback: string; // 항목별 피드백 코멘트
}

// 회의록 코칭 결과 리포트 전체.
export interface FeedbackReport {
  totalScore: number; // 전체 획득 점수 합계
  maxScore: number; // 전체 만점
  items: RubricScoreItem[]; // 각 루브릭 항목별 채점 결과 목록
  summary: string; // 총평 요약
}

// 백엔드 공통 응답 래퍼. 성공 여부에 따라 data 또는 error 중 하나가 채워진다.
export interface ApiResponse<T> {
  success: boolean; // 요청 성공 여부
  data?: T; // 성공 시 실제 데이터
  error?: {
    statusCode: number; // HTTP 상태 코드
    message: string | string[]; // 에러 메시지 (NestJS는 배열로 줄 수 있음)
  };
}
