# CLAUDE.md — 회의록 코치 프론트엔드

이 문서는 이 저장소에서 작업할 때 지켜야 할 규칙이다. 코드를 추가·수정하기 전에 반드시 따른다.

## 프로젝트 개요

회의록 코치의 **프론트엔드**다. 사용자가 회의 유형·아젠다·회의록(텍스트 또는 음성)을 입력하면,
NestJS 게이트웨이 백엔드로 보내 루브릭 기반 채점 결과를 받아 보여준다.

- **프레임워크**: Next.js (App Router) + TypeScript
- **서버 상태**: TanStack React Query
- **폼**: React Hook Form + Zod
- **스타일**: Tailwind CSS (다크모드 대응)

프론트엔드는 **백엔드하고만 통신한다.** STT·Claude 같은 외부 서비스를 직접 부르지 않는다.

## 레이어 구조와 책임 (반드시 준수)

```
src/
├── app/           # 페이지·레이아웃 (App Router). 화면 조립만.
├── components/    # 재사용 UI 컴포넌트. 프레젠테이션 위주.
├── lib/
│   ├── api.ts         # 백엔드 REST 호출 레이어 (fetch 래핑, 응답 파싱, 에러 정규화)
│   ├── use*.ts        # React Query 훅 (useMeetingTypes, useFeedback 등)
│   └── *Schema.ts     # Zod 검증 스키마
└── types/         # 공유 타입 정의
```

각 레이어는 자기 책임만 진다.

- **api.ts** — 백엔드 호출과 응답/에러 처리를 여기 한곳에 모은다. 컴포넌트가 직접 `fetch`하지 않는다.
- **use\*.ts (React Query 훅)** — 서버 상태(로딩·에러·데이터)를 다룬다. 컴포넌트는 이 훅을 통해서만 데이터를 얻는다.
- **components / app** — UI와 사용자 상호작용. 비즈니스 로직·직접 통신을 넣지 않는다.
- **\*Schema.ts** — 입력 검증. 백엔드 밸리데이션 규칙과 1:1로 맞춰 프론트에서 먼저 거른다.

## 백엔드 API 계약

모든 응답은 다음 형태다. `api.ts`가 이 계약대로 파싱·처리하므로 새 호출도 이를 따른다.

```ts
// 성공
{ success: true, data: T }
// 실패
{ success: false, error: { statusCode: number, message: string | string[] } }
```

- 성공이면 `data`만 꺼내 반환한다.
- `!response.ok || !body.success`면 `error.message`를 정규화해 throw한다. (NestJS는 검증 실패 시 message를 배열로 주기도 하므로 배열이면 합친다.)
- 에러는 컴포넌트가 아니라 `api.ts`에서 일관되게 처리하고, 컴포넌트는 React Query의 `isError`/`error`로 표시만 한다.

### 알려진 엔드포인트

| 메서드 | 경로 | 용도 |
|---|---|---|
| GET | `/meeting-types` | 회의 유형 드롭다운 데이터 |
| POST | `/feedback` | 텍스트 회의록 채점 (JSON) |
| POST | `/feedback/audio` | 음성 회의록 채점 (multipart/form-data) |

- **JSON 요청**은 `Content-Type: application/json`으로 보낸다 (기존 `request` 함수가 처리).
- **multipart 요청**(음성 업로드)은 `Content-Type`을 **직접 지정하지 않는다.** 브라우저가 boundary와 함께 자동 설정하게 둔다. 수동 지정하면 업로드가 깨진다.

## 환경 변수

- `NEXT_PUBLIC_API_BASE_URL` — 백엔드 기본 URL. 없으면 `http://localhost:3000` 폴백.
- 클라이언트에 노출되는 값(`NEXT_PUBLIC_`)에는 비밀값을 넣지 않는다.

## 코드 규칙

- **새 코드에는 한국어 주석**을 단다 (기존 파일들의 스타일을 따른다).
- 기존 레이어 분리를 깨지 않는다. 새 API 호출은 `api.ts`에, 서버 상태는 React Query 훅에, 검증은 Zod 스키마에 둔다.
- 컴포넌트에서 직접 `fetch`하거나 비즈니스 로직을 넣지 않는다.
- 스타일은 기존 Tailwind 클래스 패턴과 다크모드 대응(`dark:`)을 따른다.
- 작업 후 `npm run build`와 `npm run lint`가 통과하는지 확인한다.

## DO NOT

- 기존에 동작하는 흐름(특히 텍스트 채점)을 건드리지 마라. 기능 추가는 기존 경로를 보존한 채 확장한다.
- 백엔드 응답 계약(`{ success, data }` / `{ success, error }`)을 임의로 바꾸지 마라.
- multipart 요청에 `Content-Type`을 수동으로 넣지 마라.
- 비밀값을 프론트 코드나 `NEXT_PUBLIC_` 변수에 넣지 마라.
- 요청하지 않은 대규모 리팩터링·의존성 추가를 하지 마라.