// 퀴즈 세션: 정답을 미리 보내지 않고 서버가 한 문제씩 채점한다 (보안 점검 11/25)
// - 퀴즈를 받을 때 세션을 만들고, 보기 순서(섞은 결과)를 서버가 기억한다
// - 문제마다 「처음 고른 답」만 기록한다 → 답을 알아낸 뒤 다시 보내도 점수는 안 바뀐다
// - 출제 자격은 이 기록으로만 판정한다. 서버 메모리에만 두고 2시간 뒤 지운다
import { randomBytes } from 'node:crypto'

const TTL_MS = 2 * 60 * 60 * 1000
const MAX_SESSIONS = 5000
const sessions = new Map() // id → { level, category, items: Map(questionId → { q, choices, answer }), picks: Map(questionId → choiceIndex), at }

function sweep() {
  const now = Date.now()
  for (const [id, s] of sessions) if (now - s.at > TTL_MS) sessions.delete(id)
  // 너무 많으면 오래된 것부터 지운다 (메모리 보호)
  while (sessions.size > MAX_SESSIONS) sessions.delete(sessions.keys().next().value)
}

const fail = (msg, status = 400) => Object.assign(new Error(msg), { status })

// questions: 이미 보기를 섞은 문제 목록 (answer는 섞은 뒤 번호)
export function createSession({ level, category, questions }) {
  sweep()
  const id = randomBytes(18).toString('base64url')
  const items = new Map(questions.map((q) => [q.id, q]))
  sessions.set(id, { level, category, items, picks: new Map(), at: Date.now() })
  return id
}

function getSession(id) {
  const s = sessions.get(id)
  if (!s || Date.now() - s.at > TTL_MS) throw fail('퀴즈가 만료됐어요. 처음부터 다시 풀어 주세요.', 410)
  return s
}

// 한 문제 채점. 처음 고른 답만 기록하고, 결과(정답 번호 · 해설 · 출처)를 돌려준다
export function answer(sessionId, questionId, choice) {
  const s = getSession(sessionId)
  const q = s.items.get(questionId)
  if (!q) throw fail('이 퀴즈에 없는 문제예요.')
  const c = Number(choice)
  if (!Number.isInteger(c) || c < 0 || c >= q.choices.length) throw fail('보기를 골라 주세요.')
  if (!s.picks.has(questionId)) s.picks.set(questionId, c)
  const picked = s.picks.get(questionId)
  return {
    picked,
    correct: picked === q.answer,
    answer: q.answer,
    explanation: q.explanation,
    source: q.source,
    author: q.author,
    origin: q.origin,
  }
}

// 세션 결과 (출제 자격 판정용). 모든 문제를 풀어야 한다. 한 번 쓰면 세션을 지운다
export function finishSession(sessionId) {
  const s = getSession(sessionId)
  if (s.picks.size < s.items.size) throw fail('끝까지 풀어야 해요.')
  const correct = [...s.items.values()].filter((q) => s.picks.get(q.id) === q.answer).length
  sessions.delete(sessionId)
  return { level: s.level, count: s.items.size, percent: Math.round((correct / s.items.size) * 100) }
}

// 화면으로 보내는 문제: 정답 · 해설 · 출처는 빼고
export function hideAnswer(q) {
  const { id, level, category, type, question, choices } = q
  return { id, level, category, type, question, choices }
}
