// 회의록 평가 리포트를 보기 좋게 렌더링하는 컴포넌트.
// 총점 → 항목별 채점 → 총평 순서로 표시한다.

import type { FeedbackReport } from '@/types/feedback';

export default function FeedbackResult({ report }: { report: FeedbackReport }) {
  const { totalScore, maxScore, items, summary } = report;
  // 총점 비율(0~100). maxScore가 0이어도 나눗셈 오류가 나지 않게 방어한다.
  const totalPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* 총점 */}
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          평가 결과
        </h2>
        <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {totalScore}
          <span className="text-xl font-medium text-zinc-400"> / {maxScore}</span>
          <span className="ml-2 align-middle text-base font-medium text-zinc-500">
            ({totalPercent}%)
          </span>
        </p>
      </header>

      {/* 항목별 채점 */}
      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const percent =
            item.maxScore > 0
              ? Math.round((item.score / item.maxScore) * 100)
              : 0;
          return (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {item.label}
                </span>
                <span className="shrink-0 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {item.score} / {item.maxScore}
                </span>
              </div>
              {/* 점수 막대 */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                <div
                  className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.feedback}
              </p>
            </li>
          );
        })}
      </ul>

      {/* 총평 */}
      <footer className="flex flex-col gap-2 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800/60">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          총평
        </h3>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {summary}
        </p>
      </footer>
    </section>
  );
}
