// 메인 화면 — 성격 유형 테스트처럼: 시작 → 한 화면에 한 문제 → 결과 카드(등급)
// 문제 내기는 출제 자격이 있을 때 시작 화면 링크와 결과 화면 버튼으로 (01 PRD Q5 ①②)
import { useEffect, useState } from 'react'
import {
  answerApi,
  fetchMeta,
  fetchQuiz,
  fetchRecent,
  loadHistory,
  loadQualification,
  qualifyApi,
  saveHistory,
  saveQualification,
  submitQuestionApi,
} from './api.js'
import QuestionForm from './QuestionForm.jsx'
import { EMPTY_QUESTION } from './questionDefaults.js'
import { Alert, Button } from './ui/index.jsx'
import './App.css'

// 결과 유형. 점수 구간마다 이름 · 한 줄 설명 (캠퍼스 사실이 아니라 말투만)
const TYPES = {
  senior: [
    { min: 80, name: '고인물', line: '학교 구석구석 다 아는 진짜 고인물. 이제 문제를 낼 차례예요.' },
    { min: 60, name: '화석', line: '오래 다녔지만 놓친 디테일이 조금 있어요. 틀린 문제만 챙기면 고인물!' },
    { min: 40, name: '새내기', line: '다닌 만큼은 아는데, 디테일은 아직이에요.' },
    { min: 0, name: '뉴비', line: '재학생 맞죠? 신·편입생 버전부터 다시 풀어 봐요.' },
  ],
  newbie: [
    { min: 80, name: '준비된 새내기', line: '안내문을 안 읽고도 다 아는 타입. 첫 학기 걱정 없어요.' },
    { min: 60, name: '적응 완료', line: '기본은 갖췄어요. 틀린 문제만 챙기면 완벽해요.' },
    { min: 40, name: '셔틀 탑승 성공', line: '학교는 잘 찾아왔는데, 아직 모르는 게 많아요.' },
    { min: 0, name: '길 잃은 새내기', line: '괜찮아요, 다들 처음엔 그래요. 해설부터 천천히 봐요.' },
  ],
}
const typeOf = (level, percent) => TYPES[level].find((t) => percent >= t.min)

function scoreOf(round) {
  const correct = round.questions.filter((q, i) => q.answer === round.answers[i]).length
  return Math.round((correct / round.questions.length) * 100)
}

export default function App() {
  const [meta, setMeta] = useState(null)
  const [recent, setRecent] = useState([])
  const [screen, setScreen] = useState('start') // start | quiz | result | submit | submitted
  const [round, setRound] = useState(null) // { level, category, questions, answers, retry }
  const [qual, setQual] = useState(() => loadQualification())
  const [history, setHistory] = useState(() => loadHistory())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchMeta().then(setMeta).catch((e) => setError(e.message))
    fetchRecent().then(setRecent).catch(() => {})
  }, [])

  function go(next) {
    setScreen(next)
    setError('')
    window.scrollTo(0, 0)
  }

  async function start(level, category = 'all', questions = null) {
    setError('')
    try {
      // 틀린 것만 다시 풀기는 이미 정답을 본 문제라 화면에서 채점(local), 새 퀴즈는 서버가 채점
      const data = questions ? { sessionId: null, questions } : await fetchQuiz(level, category)
      if (!data.questions.length) {
        setError('아직 공개된 문제가 없어요.')
        return
      }
      setRound({ level, category, sessionId: data.sessionId, questions: data.questions, answers: [], retry: Boolean(questions) })
      go('quiz')
    } catch (e) {
      setError(e.message)
    }
  }

  // revealed: 정답 · 해설까지 받은 문제 목록 (서버 채점 결과를 합친 것)
  async function finish(answers, revealed) {
    const done = { ...round, questions: revealed, answers }
    setRound(done)
    go('result')
    const percent = scoreOf(done)

    // 내 기록 (PRD Q6: 두 번째 풀이 정답률 비교에 쓴다)
    const nextHistory = [
      { level: done.level, category: done.category, retry: done.retry, percent, count: done.questions.length, at: new Date().toISOString() },
      ...history,
    ]
    setHistory(nextHistory)
    saveHistory(nextHistory)

    // 재학생 버전을 처음부터 끝까지 풀고 80점 이상이면 서버가 다시 채점해 출제 자격을 준다
    if (done.level === 'senior' && !done.retry && percent >= meta.qualifyScore) {
      try {
        // 서버가 기록한 첫 답으로만 판정한다 (화면 점수는 참고용)
        const res = await qualifyApi(done.sessionId)
        const q = { token: res.token, percent: res.percent, exp: res.exp }
        saveQualification(q)
        setQual(q)
      } catch (e) {
        setError(e.message)
      }
    }
  }

  async function submitQuestion(question) {
    setBusy(true)
    setError('')
    try {
      await submitQuestionApi(question, qual?.token)
      go('submitted')
    } catch (e) {
      if (e.status === 403) {
        saveQualification(null)
        setQual(null)
      }
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!meta) {
    return (
      <div className="mb-app">
        <main className="mb-main">{error ? <Alert tone="danger">{error}</Alert> : <p className="ev-muted">불러오는 중…</p>}</main>
      </div>
    )
  }

  const total = (meta.counts.newbie?.all ?? 0) + (meta.counts.senior?.all ?? 0)

  return (
    <div className="mb-app">
      {screen !== 'start' && (
        <header className="mb-top">
          <button type="button" className="mb-top-home" onClick={() => go('start')}>
            단국러닝
          </button>
          {qual && <span className="ev-chip-accent">출제 자격</span>}
        </header>
      )}

      <main className="mb-main">
        {error && <Alert tone="warning">{error}</Alert>}

        {screen === 'start' && (
          <Start
            meta={meta}
            total={total}
            qual={qual}
            last={history[0]}
            onStart={start}
            onSubmit={() => go('submit')}
          />
        )}

        {screen === 'quiz' && round && <Quiz meta={meta} round={round} onFinish={finish} onQuit={() => go('start')} />}

        {screen === 'result' && round && (
          <Result
            meta={meta}
            round={round}
            qualified={Boolean(qual)}
            recent={recent}
            onRetryWrong={(wrong) => start(round.level, round.category, wrong)}
            onAgain={() => start(round.level, round.category)}
            onSenior={() => start('senior')}
            onHome={() => go('start')}
            onSubmit={() => go('submit')}
          />
        )}

        {screen === 'submit' && (
          <section className="ev-card ev-pad">
            <h1 className="ev-h2">문제 내기</h1>
            <p className="ev-muted">
              고인물만 낼 수 있어요. 올린 문제는 관리자 검수 뒤 공개돼요. 실명 · 연락처처럼 사람을 알아볼 수 있는 내용은 넣지 마세요.
            </p>
            {qual ? (
              <QuestionForm meta={meta} initial={EMPTY_QUESTION} onSubmit={submitQuestion} onCancel={() => go('start')} busy={busy} />
            ) : (
              <div className="ev-empty">
                <p>
                  재학생 버전에서 <strong>{meta.qualifyScore}점 이상</strong>을 받으면 출제 자격이 생겨요.
                </p>
                <Button onClick={() => start('senior')}>고인물 도전하러 가기</Button>
              </div>
            )}
          </section>
        )}

        {screen === 'submitted' && (
          <section className="ev-card ev-pad ev-center">
            <h1 className="ev-h2">올렸어요!</h1>
            <p className="ev-muted">관리자가 확인한 뒤 퀴즈에 나와요.</p>
            <div className="ev-row ev-row-center">
              <Button variant="secondary" onClick={() => go('submit')}>
                하나 더 내기
              </Button>
              <Button onClick={() => go('start')}>처음으로</Button>
            </div>
          </section>
        )}
      </main>

      <footer className="mb-foot">
        문제마다 출처가 있어요. 셔틀 시간 · 학사 일정은 학교 공지로 한 번 더 확인하세요. <a href="/admin">관리</a>
      </footer>
    </div>
  )
}

function Start({ meta, total, qual, last, onStart, onSubmit }) {
  return (
    <section className="mb-start">
      <p className="mb-kicker">단국대 천안캠퍼스 · 단국러닝</p>
      <h1 className="mb-title">
        나는 천캠
        <br />
        <span className="mb-title-em">고인물</span>일까?
      </h1>
      <p className="mb-sub">10문제로 알아보는 캠퍼스 적응도</p>

      <div className="mb-start-buttons">
        <button type="button" className="mb-big" onClick={() => onStart('newbie')}>
          <span className="mb-big-name">신·편입생으로 시작</span>
          <span className="mb-big-desc">셔틀 · 학식 · 학사 기본 정보, 해설로 배워요</span>
        </button>
        <button type="button" className="mb-big mb-big-dark" onClick={() => onStart('senior')}>
          <span className="mb-big-name">재학생 고인물 도전</span>
          <span className="mb-big-desc">
            {meta.qualifyScore}점 이상이면 고인물 인증 · 문제를 낼 수 있어요
          </span>
        </button>
      </div>

      <p className="mb-count">
        문제 {total}개 · 단국대 공식 홈페이지와 재학생 제보 기반
        {last && ` · 내 최근 점수 ${last.percent}점`}
      </p>

      {qual && (
        <nav className="mb-links" aria-label="다른 메뉴">
          <button type="button" onClick={onSubmit}>
            문제 내기
          </button>
        </nav>
      )}
    </section>
  )
}

function Quiz({ meta, round, onFinish, onQuit }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [revealed, setRevealed] = useState([]) // 정답 · 해설을 받은 문제
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const base = round.questions[index]
  const q = revealed[index] ?? base
  const picked = answers[index]
  const done = picked !== undefined && revealed[index] !== undefined
  const last = index === round.questions.length - 1

  async function pick(i) {
    if (done || checking) return
    setError('')
    let full = base
    if (round.sessionId) {
      setChecking(true)
      try {
        const r = await answerApi(round.sessionId, base.id, i)
        full = { ...base, answer: r.answer, explanation: r.explanation, source: r.source, author: r.author, origin: r.origin }
        i = r.picked // 서버가 기록한 첫 답
      } catch (e) {
        setError(e.message)
        setChecking(false)
        return
      }
      setChecking(false)
    }
    const nextAnswers = [...answers]
    nextAnswers[index] = i
    const nextRevealed = [...revealed]
    nextRevealed[index] = full
    setAnswers(nextAnswers)
    setRevealed(nextRevealed)
  }

  return (
    <section className="mb-quiz">
      <div className="mb-quiz-top">
        <button type="button" className="mb-quit" onClick={onQuit}>
          그만하기
        </button>
        <span className="ev-muted">
          {index + 1} / {round.questions.length}
        </span>
      </div>
      <div className="mb-dots" aria-hidden="true">
        {round.questions.map((x, i) => (
          <span key={x.id} className={i < index || (i === index && done) ? 'on' : i === index ? 'now' : ''} />
        ))}
      </div>

      <p className="mb-q-tag">
        {round.retry ? '다시 풀기' : meta.levels[q.level]} · {meta.categories[q.category]}
      </p>
      <h1 className="mb-question">{q.question}</h1>

      <div className={q.type === 'ox' ? 'mb-choices ox' : 'mb-choices'}>
        {q.choices.map((c, i) => {
          const state = !done ? '' : i === q.answer ? 'correct' : i === picked ? 'wrong' : 'dim'
          return (
            <button key={i} type="button" className={`mb-choice ${state}`} onClick={() => pick(i)} disabled={done || checking} aria-pressed={picked === i}>
              {c}
            </button>
          )
        })}
      </div>

      {error && <Alert tone="warning">{error}</Alert>}
      {done && (
        <div className="mb-explain" role="status">
          <p className={picked === q.answer ? 'mb-verdict ok' : 'mb-verdict no'}>{picked === q.answer ? '정답!' : `아쉬워요. 정답은 「${q.choices[q.answer]}」`}</p>
          <p>{q.explanation}</p>
          <p className="ev-meta">
            출처 · {q.source} · 출제 {q.origin === 'ai' ? 'AI 초안 (관리자 검수)' : q.author}
          </p>
          <Button size="lg" onClick={() => (last ? onFinish(answers, revealed) : setIndex(index + 1))}>
            {last ? '결과 보기' : '다음 문제'}
          </Button>
        </div>
      )}
    </section>
  )
}

function Result({ meta, round, qualified, recent, onRetryWrong, onAgain, onSenior, onHome, onSubmit }) {
  const [showWrong, setShowWrong] = useState(false)
  const [shared, setShared] = useState('')
  const percent = scoreOf(round)
  const wrong = round.questions.filter((q, i) => q.answer !== round.answers[i])
  const correct = round.questions.length - wrong.length
  const type = typeOf(round.level, percent)
  const ladder = TYPES[round.level].slice().reverse()
  const gosu = round.level === 'senior' && !round.retry && percent >= meta.qualifyScore

  async function share() {
    const text = `단국러닝 결과: 나는 「${type.name}」 (${percent}점)! 너는 천캠 고인물일까? ${window.location.origin}`
    try {
      if (navigator.share) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShared('결과 문구를 복사했어요. 단톡방에 붙여 넣어 보세요!')
    } catch {
      setShared('공유가 막혀 있어요. 화면을 캡처해서 보내 주세요.')
    }
  }

  return (
    <>
      <section className={round.level === 'senior' ? 'mb-card dark' : 'mb-card'}>
        <p className="mb-card-kicker">{round.retry ? '다시 풀기 결과' : `${meta.levels[round.level]} 버전 · 나의 유형은`}</p>
        <h1 className="mb-card-name">{type.name}</h1>
        <p className="mb-card-line">{type.line}</p>
        <p className="mb-card-score">
          <strong>{percent}점</strong> · {round.questions.length}문제 중 {correct}개 정답
        </p>
        <div className="mb-ladder" aria-label={`단계: ${type.name}`}>
          {ladder.map((t) => (
            <span key={t.name} className={t.name === type.name ? 'on' : ''}>
              {t.name}
            </span>
          ))}
        </div>
        <p className="mb-card-brand">단국러닝 · 천캠 고인물 테스트</p>
      </section>

      {gosu && qualified && (
        <button type="button" className="mb-big mb-big-dark mb-cta" onClick={onSubmit}>
          <span className="mb-big-name">고인물 인증! 문제 내러 가기</span>
          <span className="mb-big-desc">내가 아는 천캠 꿀팁을 문제로 내 보세요</span>
        </button>
      )}
      {round.level === 'newbie' && !round.retry && percent >= 80 && (
        <button type="button" className="mb-big mb-big-dark mb-cta" onClick={onSenior}>
          <span className="mb-big-name">이 정도면 재학생 버전도?</span>
          <span className="mb-big-desc">고인물 도전하고 출제 자격 받기</span>
        </button>
      )}

      <div className="mb-actions">
        <Button onClick={share}>결과 공유하기</Button>
        {wrong.length > 0 && (
          <Button variant="secondary" onClick={() => setShowWrong(!showWrong)}>
            {showWrong ? '해설 닫기' : `틀린 문제 해설 (${wrong.length})`}
          </Button>
        )}
        <Button variant="secondary" onClick={onAgain}>
          다시 하기
        </Button>
      </div>
      {shared && <p className="ev-muted mb-center">{shared}</p>}

      {showWrong && (
        <section className="ev-card">
          <div className="ev-card-head ev-card-head-row">
            <div>
              <h2 className="ev-h3">틀린 문제 해설</h2>
            </div>
            <Button size="sm" onClick={() => onRetryWrong(wrong)}>
              틀린 것만 다시
            </Button>
          </div>
          <NoteList meta={meta} items={wrong} />
        </section>
      )}

      {recent.length > 0 && (
        <section className="ev-card">
          <div className="ev-card-head">
            <h2 className="ev-h3">최근 공개된 문제</h2>
          </div>
          <ul className="ev-feed">
            {recent.map((q) => (
              <li key={q.id}>
                <p className="ev-feed-title">{q.question}</p>
                <p className="ev-meta">
                  <span className="ev-meta-tag">{meta.categories[q.category]}</span>
                  {meta.levels[q.level]} · {q.origin === 'ai' ? 'AI 초안 (검수)' : q.author}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-center">
        <Button variant="ghost" onClick={onHome}>
          처음으로
        </Button>
      </div>
    </>
  )
}

function NoteList({ meta, items }) {
  return (
    <ul className="ev-feed">
      {items.map((q) => (
        <li key={q.id}>
          <p className="ev-feed-title">{q.question}</p>
          <p className="ev-feed-body">
            정답 <strong>{q.choices[q.answer]}</strong> — {q.explanation}
          </p>
          <p className="ev-meta">
            <span className="ev-meta-tag">{meta.categories[q.category]}</span>출처 · {q.source}
          </p>
        </li>
      ))}
    </ul>
  )
}
