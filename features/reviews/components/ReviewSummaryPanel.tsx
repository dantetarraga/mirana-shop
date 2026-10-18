import { ReviewStars } from '@/features/reviews/components/ReviewStars'
import {
  distributionPercent,
  formatAverage,
  RATING_VALUES,
  reviewCountLabel,
  starsLabel,
  type ReviewSummary,
} from '@/features/reviews/lib/review-summary'
import { Star } from 'lucide-react'

/**
 * El promedio es la pieza protagonista del bloque: una cifra grande en la
 * tipografía de display de la marca. Todo lo demás (barras, conteo) queda
 * en segundo plano, fino y en tonos de texto.
 */
export function ReviewSummaryPanel({ summary }: { summary: ReviewSummary }) {
  return (
    <div>
      <div className="flex items-end gap-4">
        <p className="font-display font-black leading-[0.8] tracking-[-2px] text-[clamp(72px,9vw,112px)] text-text">
          <span className="sr-only">Calificación promedio: </span>
          {formatAverage(summary.average)}
          <span className="sr-only"> de 5</span>
        </p>
        <div className="pb-1.5 flex flex-col gap-1.5">
          <ReviewStars value={summary.average} size={18} />
          <p className="text-[13px] text-muted">{reviewCountLabel(summary.count)}</p>
        </div>
      </div>

      <dl className="mt-6 flex flex-col gap-2 max-w-sm">
        {RATING_VALUES.map((n) => {
          const value = summary.distribution[n]
          const pct = distributionPercent(value, summary.count)
          return (
            <div key={n} className="grid grid-cols-[2.25rem_1fr_2.5rem] items-center gap-3 text-[12px]">
              <dt className="flex items-center gap-1 text-muted tabular-nums">
                {n}
                <Star size={11} strokeWidth={1.5} fill="currentColor" aria-hidden />
                <span className="sr-only">{starsLabel(n).replace(/^\d+ /, '')}</span>
              </dt>
              <dd className="contents">
                <span aria-hidden className="block h-1.5 bg-(--bd) overflow-hidden">
                  <span className="block h-full bg-(--gold)" style={{ width: `${pct}%` }} />
                </span>
                <span className="text-right text-muted tabular-nums">
                  {value}
                  <span className="sr-only"> ({pct} %)</span>
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
