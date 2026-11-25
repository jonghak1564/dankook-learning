// 문제 규칙: 분야 · 난이도 · 입력 확인 · 금지어 · 비슷한 문제 · 출제 자격
// 규칙으로 할 수 있는 일은 여기서 AI 없이 처리한다 (CLAUDE.md 변경 작업 원칙 1)
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

export const LEVELS = { newbie: '신·편입생', senior: '재학생' }
export const CATEGORIES = {
  transport: '셔틀 · 교통',
  academic: '학사 제도',
  food: '학식 · 편의시설',
  campus: '건물 · 시설',
  etc: '역사 · 기타',
}

export const QUIZ_SIZE = 10
export const QUALIFY_SCORE = 80 // 재학생 버전 이 점수(%) 이상이면 출제 자격

// 금지어: 욕설 · 비하 (규칙으로 먼저 거른다. 빠진 말은 AI 점검과 관리자가 본다)
const BANNED = ['시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '좆', '존나', '개새', '미친놈', '미친년', '닥쳐', '꺼져']

// 개인정보로 보이는 형식 (전화번호 · 이메일 · 학번처럼 긴 숫자)
const PERSONAL = [
  [/01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/, '전화번호로 보이는 숫자'],
  [/[\w.+-]+@[\w-]+\.[\w.]+/, '이메일 주소'],
  [/\b\d{8,}\b/, '학번 · 계좌번호로 보이는 긴 숫자'],
]

const clean = (s, max) => String(s ?? '').trim().slice(0, max)

// 화면 · AI 초안에서 들어온 문제를 확인하고 정리한다. 틀리면 400 오류
export function normalizeQuestion(input) {
  const fail = (msg) => {
    throw Object.assign(new Error(msg), { status: 400 })
  }
  const level = input.level in LEVELS ? input.level : fail('난이도를 골라 주세요.')
  const category = input.category in CATEGORIES ? input.category : fail('분야를 골라 주세요.')
  const type = input.type === 'ox' ? 'ox' : 'choice'
  const question = clean(input.question, 200) || fail('문제를 적어 주세요.')
  const choices = type === 'ox' ? ['O', 'X'] : (input.choices ?? []).map((c) => clean(c, 80))
  if (type === 'choice' && (choices.length !== 4 || choices.some((c) => !c))) fail('보기 4개를 모두 적어 주세요.')
  if (type === 'choice' && new Set(choices).size !== 4) fail('보기가 서로 달라야 해요.')
  const answer = Number(input.answer)
  if (!Number.isInteger(answer) || answer < 0 || answer >= choices.length) fail('정답을 골라 주세요.')
  const explanation = clean(input.explanation, 400) || fail('해설을 적어 주세요. 해설이 있어야 배울 수 있어요.')
  const source = clean(input.source, 120) || fail('출처를 적어 주세요. (예: 학교 홈페이지 셔틀 안내, 직접 경험)')
  const author = clean(input.author, 20) || '익명'
  return { level, category, type, question, choices, answer, explanation, source, author }
}

// 규칙 점검: 금지어 · 개인정보 형식 · 비슷한 문제. 결과는 관리자 검수 화면에 표시
export function ruleCheck(q, existing) {
  const text = [q.question, ...q.choices, q.explanation].join(' ')
  const reasons = []
  const bad = BANNED.filter((w) => text.includes(w))
  if (bad.length) reasons.push(`금지어: ${bad.join(', ')}`)
  for (const [re, label] of PERSONAL) if (re.test(text)) reasons.push(`개인정보 의심: ${label}`)
  const similar = existing
    .filter((e) => e.id !== q.id && e.status !== 'rejected')
    .map((e) => ({ e, s: similarity(e.question, q.question) }))
    .filter(({ s }) => s >= 0.5)
    .sort((a, b) => b.s - a.s)[0]
  if (similar) reasons.push(`비슷한 문제 있음: 「${similar.e.question}」`)
  return reasons
}

// 글자 두 개씩 묶은 조각이 얼마나 겹치는지 (0~1)
export function similarity(a, b) {
  const grams = (s) => {
    const t = s.replace(/\s+/g, '')
    const set = new Set()
    for (let i = 0; i < t.length - 1; i += 1) set.add(t.slice(i, i + 2))
    return set
  }
  const A = grams(a)
  const B = grams(b)
  if (!A.size || !B.size) return 0
  let same = 0
  for (const g of A) if (B.has(g)) same += 1
  return same / (A.size + B.size - same)
}

// 퀴즈 문제 고르기: 승인된 문제 중 무작위 QUIZ_SIZE개
export function pickQuiz(questions, { level, category }) {
  const pool = questions.filter(
    (q) => q.status === 'approved' && q.level === level && (category === 'all' || q.category === category),
  )
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, QUIZ_SIZE).map((q) => shuffleChoices(publicView(q))) // 정답 포함 — 서버 세션에만 두고 화면엔 hideAnswer()로
}

// 4지선다는 보기 순서를 매번 섞는다 (정답이 늘 1번이면 찍어서 고인물이 된다). O/X는 그대로
function shuffleChoices(q) {
  if (q.type === 'ox') return q
  const order = q.choices.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) }
}

// 화면에 보내는 모양 (검수 정보 · AI 근거는 빼고)
export function publicView(q) {
  const { id, level, category, type, question, choices, answer, explanation, source, author, origin } = q
  return { id, level, category, type, question, choices, answer, explanation, source, author, origin }
}

// 등급 (재학생 버전)
export function gradeOf(percent) {
  if (percent >= QUALIFY_SCORE) return '고인물'
  if (percent >= 60) return '화석'
  if (percent >= 40) return '새내기'
  return '뉴비'
}

// 출제 자격 표: 재학생 버전을 서버 세션에서 80점 이상 받은 경우에만 서명해 준다 (server/sessions.js)
// 로그인 대신 브라우저에 저장한다 (01 PRD). 7일 지나면 다시 받아야 한다
// APP_SECRET이 없으면 서버를 다시 켤 때 이전 표가 무효가 된다
const SECRET = process.env.APP_SECRET || randomBytes(32).toString('hex')
const TOKEN_DAYS = 7
const sign = (body) => createHmac('sha256', SECRET).update(body).digest('base64url')

// result: finishSession() 결과 { level, count, percent }
export function issueQualification(result, totalSenior) {
  if (result.level !== 'senior') throw Object.assign(new Error('재학생 버전을 풀어야 해요.'), { status: 400 })
  if (result.count < Math.min(QUIZ_SIZE, totalSenior)) {
    throw Object.assign(new Error('재학생 버전 전체 문제로 풀어야 해요.'), { status: 400 })
  }
  if (result.percent < QUALIFY_SCORE) {
    throw Object.assign(new Error(`${QUALIFY_SCORE}점 이상이어야 출제 자격이 생겨요. (지금 ${result.percent}점)`), { status: 403 })
  }
  const exp = Date.now() + TOKEN_DAYS * 24 * 60 * 60 * 1000
  const body = Buffer.from(JSON.stringify({ percent: result.percent, exp, n: randomBytes(6).toString('hex') })).toString('base64url')
  return { token: `${body}.${sign(body)}`, percent: result.percent, exp }
}

// 맞으면 표 안의 정보를 돌려준다. 서명이 틀리거나 기간이 지나면 403
export function verifyQualification(token) {
  const [body, mac] = String(token ?? '').split('.')
  const bad = (msg) => Object.assign(new Error(msg), { status: 403 })
  if (!body || !mac) throw bad('출제 자격이 없어요. 재학생 버전에서 80점 이상을 받아 주세요.')
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    throw bad('출제 자격이 없어요. 재학생 버전에서 80점 이상을 받아 주세요.')
  }
  let data
  try {
    data = JSON.parse(Buffer.from(body, 'base64url').toString())
  } catch {
    throw bad('출제 자격 표가 깨졌어요. 다시 받아 주세요.')
  }
  if (!data.exp || data.exp < Date.now()) throw bad('출제 자격이 만료됐어요(7일). 재학생 버전을 다시 풀어 주세요.')
  return { key: mac, ...data }
}

// 문제 올리기 횟수 제한: 자격 표 하나당 1시간에 5개, 검수 대기가 200개 넘으면 잠시 막는다
const SUBMIT_PER_HOUR = 5
const MAX_PENDING = 200
const submitLog = new Map() // 표 서명 → 올린 시각들

export function checkSubmitLimit(key, pendingCount) {
  if (pendingCount >= MAX_PENDING) {
    throw Object.assign(new Error('검수 대기 문제가 많아 잠시 올릴 수 없어요. 나중에 다시 해 주세요.'), { status: 429 })
  }
  const now = Date.now()
  const recent = (submitLog.get(key) ?? []).filter((t) => now - t < 60 * 60 * 1000)
  if (recent.length >= SUBMIT_PER_HOUR) {
    throw Object.assign(new Error(`한 시간에 ${SUBMIT_PER_HOUR}개까지 올릴 수 있어요. 조금 뒤에 다시 해 주세요.`), { status: 429 })
  }
  recent.push(now)
  submitLog.set(key, recent)
  if (submitLog.size > 10000) submitLog.delete(submitLog.keys().next().value)
}
