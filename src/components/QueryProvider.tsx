'use client';

// React Query를 App Router에서 쓰기 위한 클라이언트 컴포넌트 Provider.
// Next.js 16 권장 방식: 서버 컴포넌트인 layout에서 이 Provider로 children을 감싼다.
// (React context는 서버 컴포넌트에서 쓸 수 없으므로 반드시 'use client' 경계가 필요하다.)

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

// 요청마다 새 QueryClient를 만든다.
// - 서버: 요청 간 캐시가 공유되면 안 되므로 매번 새로 만든다.
// - 브라우저: useState로 최초 1회만 만들어 리렌더에도 동일 인스턴스를 유지한다.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR 환경에서 클라이언트가 곧바로 refetch 하지 않도록 약간의 staleTime을 둔다.
        staleTime: 60 * 1000,
      },
    },
  });
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  // 초기화 함수를 넘겨 최초 렌더에서 한 번만 QueryClient를 생성한다.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
