'use client';

// 회의 유형 목록을 조회하는 React Query 훅.
// 드롭다운을 채우는 용도로 data/isLoading/error를 그대로 노출한다.

import { useQuery } from '@tanstack/react-query';
import { getMeetingTypes } from '@/lib/api';

export function useMeetingTypes() {
  return useQuery({
    queryKey: ['meetingTypes'],
    queryFn: getMeetingTypes,
  });
}
