// 문제 입력 양식: 재학생 올리기 · 관리자 직접 추가 · 고쳐서 승인에서 같이 쓴다
import { useState } from 'react'
import { EMPTY_QUESTION } from './questionDefaults.js'
import { Button, Pills, Segmented, TextField } from './ui/index.jsx'


// meta: /api/meta 결과 (이름표). fixedLevel: 난이도를 고정할 때 (재학생 올리기)
export default function QuestionForm({ meta, initial = EMPTY_QUESTION, submitLabel = '올리기', onSubmit, onCancel, busy }) {
  const [q, setQ] = useState(() => ({
    ...EMPTY_QUESTION,
    ...initial,
    choices: initial.type === 'ox' ? ['', '', '', ''] : [...(initial.choices ?? EMPTY_QUESTION.choices)],
  }))
  const set = (patch) => setQ((prev) => ({ ...prev, ...patch }))
  const choices = q.type === 'ox' ? ['O', 'X'] : q.choices

  function submit(e) {
    e.preventDefault()
    onSubmit({ ...q, choices })
  }

  return (
    <form className="qform" onSubmit={submit}>
      <div className="qform-row">
        <span className="qform-label">난이도</span>
        <Segmented label="난이도" options={Object.entries(meta.levels)} value={q.level} onChange={(level) => set({ level })} />
      </div>
      <div className="qform-row">
        <span className="qform-label">분야</span>
        <Pills label="분야" options={Object.entries(meta.categories)} value={q.category} onChange={(category) => set({ category })} />
      </div>
      <div className="qform-row">
        <span className="qform-label">형식</span>
        <Segmented
          label="형식"
          options={[
            ['choice', '4지선다'],
            ['ox', 'O / X'],
          ]}
          value={q.type}
          onChange={(type) => set({ type, answer: 0 })}
        />
      </div>

      <TextField id="qf-question" label="문제" value={q.question} maxLength={200} onChange={(e) => set({ question: e.target.value })} placeholder="예: 학식은 학생회관에서만 먹을 수 있다?" />

      <fieldset className="qform-choices">
        <legend className="qform-label">보기 · 정답 (정답 보기의 동그라미를 누르세요)</legend>
        {choices.map((c, i) => (
          <div key={i} className="qform-choice">
            <input
              type="radio"
              name="qf-answer"
              id={`qf-answer-${i}`}
              checked={q.answer === i}
              onChange={() => set({ answer: i })}
              aria-label={`${i + 1}번을 정답으로`}
            />
            {q.type === 'ox' ? (
              <label htmlFor={`qf-answer-${i}`} className="qform-ox">
                {c}
              </label>
            ) : (
              <input
                className="tb-input"
                value={c}
                maxLength={80}
                placeholder={`보기 ${i + 1}`}
                aria-label={`보기 ${i + 1}`}
                onChange={(e) => set({ choices: q.choices.map((x, j) => (j === i ? e.target.value : x)) })}
              />
            )}
          </div>
        ))}
      </fieldset>

      <label className="qform-label" htmlFor="qf-explanation">
        해설 (필수) — 왜 이게 정답인지
      </label>
      <textarea
        id="qf-explanation"
        className="qform-textarea"
        value={q.explanation}
        maxLength={400}
        onChange={(e) => set({ explanation: e.target.value })}
        placeholder="예: 치과대학에도 학식이 있어요."
      />

      <TextField id="qf-source" label="출처 (필수)" value={q.source} maxLength={120} onChange={(e) => set({ source: e.target.value })} placeholder="예: 학교 홈페이지 셔틀 안내 / 직접 경험" />
      <TextField id="qf-author" label="닉네임" value={q.author} maxLength={20} onChange={(e) => set({ author: e.target.value })} placeholder="비우면 익명" />

      <div className="qform-actions">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? '보내는 중…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
