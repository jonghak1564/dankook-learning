// 관리 페이지 (/admin): 검수 · AI 초안 · 직접 추가 · 전체 문제 (01 PRD Q5 ③)
import { useCallback, useEffect, useState } from 'react'
import {
  adminAddApi,
  adminDeleteApi,
  adminDraftApi,
  adminListApi,
  adminLoginApi,
  adminReviewApi,
  fetchHealth,
  fetchMeta,
  getAdminToken,
  setAdminToken,
} from './api.js'
import QuestionForm from './QuestionForm.jsx'
import { Alert, Badge, Button, Pills, Segmented, StatTile, Tabs, TextField } from './ui/index.jsx'
import './App.css'

const ORIGIN = { seed: '처음 문제', student: '재학생', ai: 'AI 초안', admin: '관리자', gpt: 'GPT 조사' }
const STATUS = { pending: '대기', approved: '공개', rejected: '반려' }

export default function AdminApp() {
  const [token, setToken] = useState(() => getAdminToken())
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => {})
  }, [])

  const logout = () => {
    setAdminToken(null)
    setToken(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="/">
          단국러닝
        </a>
        <span className="brand-sub">관리</span>
        {token && (
          <Button variant="ghost" size="sm" onClick={logout}>
            로그아웃
          </Button>
        )}
      </header>
      <main className="app-main">
        {!token ? (
          <Login
            onLogin={(t) => {
              setAdminToken(t)
              setToken(t)
            }}
          />
        ) : meta ? (
          <Dashboard meta={meta} onExpired={logout} />
        ) : (
          <p className="muted">불러오는 중…</p>
        )}
      </main>
    </div>
  )
}

function Login({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      onLogin(await adminLoginApi(password))
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <form className="panel login" onSubmit={submit}>
      <h1 className="panel-title">관리자 로그인</h1>
      <TextField
        id="admin-password"
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={error}
      />
      <Button type="submit">로그인</Button>
    </form>
  )
}

function Dashboard({ meta, onExpired }) {
  const [tab, setTab] = useState('pending')
  const [list, setList] = useState([])
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const guard = useCallback(
    async (fn) => {
      setError('')
      try {
        return await fn()
      } catch (err) {
        if (err.status === 401) onExpired()
        setError(err.message)
        return null
      }
    },
    [onExpired],
  )

  const reload = useCallback(() => guard(async () => setList(await adminListApi())), [guard])

  useEffect(() => {
    adminListApi()
      .then(setList)
      .catch((err) => {
        if (err.status === 401) onExpired()
        setError(err.message)
      })
    fetchHealth().then(setHealth).catch(() => {})
  }, [onExpired])

  const pending = list.filter((q) => q.status === 'pending')
  const approved = list.filter((q) => q.status === 'approved')

  return (
    <>
      <div className="stats">
        <StatTile label="검수 대기" value={pending.length} />
        <StatTile label="공개된 문제" value={approved.length} sub={`신·편입생 ${approved.filter((q) => q.level === 'newbie').length} · 재학생 ${approved.filter((q) => q.level === 'senior').length}`} />
        <StatTile label="AI" value={health?.ai?.ready ? (health.ai.reachable ? '연결됨' : '연결 안 됨') : '설정 없음'} sub={health?.ai?.model || 'OPENROUTER_MODEL 미설정'} />
      </div>

      {approved.filter((q) => q.level === 'senior').length === 0 && (
        <Alert tone="warning">재학생 버전 문제가 없어 아무도 출제 자격을 얻을 수 없어요. 「직접 추가」로 재학생 문제를 먼저 넣어 주세요.</Alert>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <Tabs
        tabs={[
          ['pending', `검수 대기 ${pending.length}`],
          ['draft', 'AI 초안 만들기'],
          ['add', '직접 추가'],
          ['all', '전체 문제'],
        ]}
        value={tab}
        onChange={(t) => {
          setTab(t)
          setNotice('')
        }}
      />

      {tab === 'pending' && (
        <section className="review-list">
          {pending.length === 0 && <p className="muted">검수할 문제가 없어요.</p>}
          {pending.map((q) => (
            <ReviewCard key={q.id} q={q} meta={meta} guard={guard} onDone={reload} />
          ))}
        </section>
      )}

      {tab === 'draft' && (
        <Draft
          meta={meta}
          guard={guard}
          onDone={(msg) => {
            setNotice(msg)
            reload()
            setTab('pending')
          }}
        />
      )}

      {tab === 'add' && (
        <section className="panel">
          <h2 className="panel-title">직접 추가</h2>
          <p className="muted">관리자가 넣는 문제는 검수 없이 바로 공개돼요. 사실을 확인한 것만 넣어 주세요.</p>
          <AddForm
            meta={meta}
            guard={guard}
            onDone={() => {
              setNotice('추가했어요. 바로 퀴즈에 나와요.')
              reload()
            }}
          />
        </section>
      )}

      {tab === 'all' && <AllList list={list} meta={meta} guard={guard} onDone={reload} />}
    </>
  )
}

// 문제를 추가할 때마다 양식을 새로 비운다 (key)
function AddForm({ meta, guard, onDone }) {
  const [n, setN] = useState(0)
  const [busy, setBusy] = useState(false)
  return (
    <QuestionForm
      key={n}
      meta={meta}
      initial={{ level: 'newbie', category: 'food', type: 'choice', author: '관리자' }}
      submitLabel="추가하고 공개"
      busy={busy}
      onSubmit={async (q) => {
        setBusy(true)
        const ok = await guard(() => adminAddApi(q))
        setBusy(false)
        if (ok) {
          setN(n + 1)
          onDone()
        }
      }}
    />
  )
}

function CheckResult({ check }) {
  if (!check) return null
  const rules = check.rules ?? []
  const ai = check.ai?.reasons ?? []
  const clean = rules.length === 0 && ai.length === 0
  return (
    <div className={clean ? 'check ok' : 'check warn'}>
      <p className="check-head">{clean ? '점검 통과' : '확인 필요'}</p>
      {rules.map((r) => (
        <p key={r}>· 규칙: {r}</p>
      ))}
      {ai.map((r) => (
        <p key={r}>· AI: {r}</p>
      ))}
      {check.aiError && <p className="muted">{check.aiError}</p>}
      <p className="muted">사실인지는 AI도 몰라요. 출처를 보고 직접 확인해 주세요.</p>
    </div>
  )
}

function ReviewCard({ q, meta, guard, onDone }) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  async function review(action, edit) {
    setBusy(true)
    const ok = await guard(() => adminReviewApi(q.id, action, edit))
    setBusy(false)
    if (ok) onDone()
  }

  if (editing) {
    return (
      <div className="panel">
        <h3 className="panel-title">고쳐서 승인</h3>
        <QuestionForm meta={meta} initial={q} submitLabel="고쳐서 승인" busy={busy} onCancel={() => setEditing(false)} onSubmit={(edit) => review('approve', edit)} />
      </div>
    )
  }

  return (
    <article className="panel review">
      <div className="review-tags">
        <Badge tone={q.origin === 'ai' || q.origin === 'gpt' ? 'accent' : 'neutral'}>{ORIGIN[q.origin] ?? q.origin}</Badge>
        <Badge>{meta.levels[q.level]}</Badge>
        <Badge>{meta.categories[q.category]}</Badge>
        <span className="muted">{q.author}</span>
      </div>
      <h3 className="review-q">{q.question}</h3>
      <ol className="review-choices">
        {q.choices.map((c, i) => (
          <li key={i} className={i === q.answer ? 'answer' : ''}>
            {c}
            {i === q.answer && ' ✓'}
          </li>
        ))}
      </ol>
      <p>
        <strong>해설</strong> {q.explanation}
      </p>
      <p className="muted">출처 · {q.source}</p>
      {q.evidence && (
        <blockquote className="evidence">
          <span className="muted">{q.origin === 'gpt' ? 'GPT가 적어 온 출처 문장' : 'AI가 든 근거 문장'}</span>
          <br />
          {q.evidence}
        </blockquote>
      )}
      <CheckResult check={q.check} />
      <div className="row-end">
        <Button variant="danger" size="sm" disabled={busy} onClick={() => review('reject')}>
          반려
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => setEditing(true)}>
          고쳐서 승인
        </Button>
        <Button size="sm" disabled={busy} onClick={() => review('approve')}>
          승인
        </Button>
      </div>
    </article>
  )
}

function Draft({ meta, guard, onDone }) {
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [level, setLevel] = useState('newbie')
  const [category, setCategory] = useState('transport')
  const [count, setCount] = useState('5')
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    const res = await guard(() => adminDraftApi({ text, source, level, category, count: Number(count) }))
    setBusy(false)
    if (res) {
      const skipped = res.skipped.length ? ` (형식이 맞지 않아 ${res.skipped.length}개는 뺐어요)` : ''
      onDone(`AI가 문제 ${res.added}개를 만들었어요${skipped}. 검수 대기에서 근거 문장과 대조해 승인해 주세요.`)
      setText('')
    }
  }

  return (
    <section className="panel">
      <h2 className="panel-title">AI 초안 만들기</h2>
      <p className="muted">
        학교 홈페이지의 공식 안내문(셔틀 · 학사 일정 · 시설 안내 등)을 붙여 넣으면 AI가 그 글만 근거로 문제 초안을 만들어요. 초안은 검수 대기로 가고,
        근거 문장이 안내문에 없으면 「확인 필요」로 표시돼요.
      </p>
      <div className="qform">
        <div className="qform-row">
          <span className="qform-label">난이도</span>
          <Segmented label="난이도" options={Object.entries(meta.levels)} value={level} onChange={setLevel} />
        </div>
        <div className="qform-row">
          <span className="qform-label">분야</span>
          <Pills label="분야" options={Object.entries(meta.categories)} value={category} onChange={setCategory} />
        </div>
        <div className="qform-row">
          <span className="qform-label">문제 수</span>
          <Segmented
            label="문제 수"
            options={[
              ['3', '3개'],
              ['5', '5개'],
              ['10', '10개'],
            ]}
            value={count}
            onChange={setCount}
          />
        </div>
        <TextField id="draft-source" label="출처 이름" value={source} onChange={(e) => setSource(e.target.value)} placeholder="예: 단국대 홈페이지 > 셔틀버스 안내 (2026-11 확인)" />
        <label className="qform-label" htmlFor="draft-text">
          안내문 ({text.length.toLocaleString()} / 6,000자)
        </label>
        <textarea id="draft-text" className="qform-textarea tall" value={text} onChange={(e) => setText(e.target.value)} placeholder="안내문을 그대로 붙여 넣으세요" />
        <div className="row-end">
          <Button onClick={run} disabled={busy || text.trim().length < 50}>
            {busy ? 'AI가 만드는 중… (최대 3분)' : 'AI로 문제 초안 만들기'}
          </Button>
        </div>
      </div>
    </section>
  )
}

function AllList({ list, meta, guard, onDone }) {
  const [filter, setFilter] = useState('approved')
  const shown = list.filter((q) => filter === 'all' || q.status === filter)
  return (
    <section className="panel">
      <Pills
        label="상태"
        options={[
          ['approved', '공개'],
          ['rejected', '반려'],
          ['all', '전부'],
        ]}
        value={filter}
        onChange={setFilter}
      />
      <table className="qtable">
        <thead>
          <tr>
            <th>문제</th>
            <th>난이도</th>
            <th>분야</th>
            <th>출제</th>
            <th>상태</th>
            <th aria-label="삭제" />
          </tr>
        </thead>
        <tbody>
          {shown.map((q) => (
            <tr key={q.id}>
              <td>{q.question}</td>
              <td>{meta.levels[q.level]}</td>
              <td>{meta.categories[q.category]}</td>
              <td>{ORIGIN[q.origin] ?? q.origin}</td>
              <td>{STATUS[q.status]}</td>
              <td>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (!window.confirm(`「${q.question}」을 지울까요?`)) return
                    if (await guard(() => adminDeleteApi(q.id))) onDone()
                  }}
                >
                  삭제
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length === 0 && <p className="muted">문제가 없어요.</p>}
    </section>
  )
}
