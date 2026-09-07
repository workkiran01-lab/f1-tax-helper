import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { animate, useReducedMotion } from 'framer-motion'
import { computeReadiness, scoreColor } from '../utils/readiness'

export default function ReadinessCard({ uid, questionnaire, compact = false }) {
  const reduceMotion = useReducedMotion()
  const [, refresh] = useState(0)
  const { score, tasks } = computeReadiness({ uid, questionnaire })
  useEffect(() => {
    const update = () => refresh((v) => v + 1)
    window.addEventListener('storage', update)
    window.addEventListener('f1-storage-change', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('f1-storage-change', update)
    }
  }, [])
  const [display, setDisplay] = useState(0)
  const color = scoreColor(score)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(score)
      return
    }
    const controls = animate(0, score, {
      duration: 0.8,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [score, reduceMotion])

  const doneCount = tasks.filter((t) => t.done).length

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0f1629] p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="pt-1 font-mono text-[10px] uppercase tracking-widest text-[#475569]">
          PREPARATION PROGRESS
        </span>
        <p className="font-mono text-4xl font-bold leading-none" style={{ color }}>
          {display}
          <span className="text-sm font-normal text-[#475569]">/100</span>
        </p>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Progress tracking only. This score does not confirm tax eligibility or submission.
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#1e293b]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>

      {compact ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-[#64748b]">{doneCount} of 5 steps complete</p>
          <Link to="/results" className="text-xs font-medium text-[#3b82f6] hover:underline">
            View all steps →
          </Link>
        </div>
      ) : score === 100 ? (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-[#22c55e]">
            ✓ Preparation steps checked — verify before filing
          </p>
          <Link
            to="/checklist"
            className="block text-xs font-medium text-[#3b82f6] hover:underline"
          >
            See filing options →
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-1">
          {tasks.map((task) =>
            task.done ? (
              <div key={task.id} className="flex items-center gap-2 px-1 py-1.5">
                <span className="text-sm text-[#22c55e]">✓</span>
                <span className="text-sm text-[#475569] line-through">{task.label}</span>
              </div>
            ) : (
              <Link
                key={task.id}
                to={task.link}
                className="group flex items-center justify-between gap-2 px-1 py-1.5"
              >
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-[#475569]" />
                  <span className="text-sm text-[#cbd5e1] transition-colors group-hover:text-[#f8fafc]">
                    {task.label}
                  </span>
                </span>
                <span className="shrink-0 rounded border border-[#1e293b] px-1.5 py-0.5 font-mono text-[10px] text-[#475569]">
                  +{task.points} pts
                </span>
              </Link>
            ),
          )}
        </div>
      )}
    </div>
  )
}
