// API. 보통은 npm run dev 하나로 화면과 같은 포트(PORT)에서 열린다 (vite.config.js).
// API만 따로 시험할 때: npm run server. 키는 .env.local에서 읽고 브라우저로 보내지 않는다
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { adminConfigured, login, requireAdmin } from './admin.js'
import { chatJson, llmInfo, pingModel } from './llm/client.js'
import { buildCheckMessages, buildDraftMessages, CHECK_SCHEMA, DRAFT_SCHEMA } from './llm/prompts.js'
import {
  CATEGORIES,
  checkSubmitLimit,
  gradeOf,
  issueQualification,
  LEVELS,
  normalizeQuestion,
  pickQuiz,
  QUALIFY_SCORE,
  QUIZ_SIZE,
  ruleCheck,
  verifyQualification,
} from './questions.js'
import { answer, createSession, finishSession, hideAnswer } from './sessions.js'
import { addQuestions, allQuestions, getQuestion, removeQuestion, updateQuestion } from './store.js'

const STARTED_AT = new Date().toISOString()
// npm run serve(scripts/serve.mjs)로 켰을 때만 다시 켜기를 할 수 있다. 이 종료 코드면 serve가 다시 켠다
const SUPERVISED = process.env.APP_SUPERVISED === '1'
const RESTART_EXIT_CODE = 75
const MAX_BODY = 200_000
const MAX_SOURCE_TEXT = 6_000 // AI 초안에 넣는 안내문 길이 (무료 모델 문맥 크기 고려)

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > MAX_BODY) throw Object.assign(new Error('요청이 너무 커요.'), { status: 413 })
  }
  try {
    return JSON.parse(raw || '{}')
  } catch {
    throw Object.assign(new Error('JSON 형식이 아니에요.'), { status: 400 })
  }
}

const bad = (msg, status = 400) => Object.assign(new Error(msg), { status })

// 재학생 문제 점검: 규칙(금지어 · 개인정보 형식 · 비슷한 문제) + AI(설정돼 있으면). 결과는 검수 화면에 표시
async function checkSubmission(q) {
  const rules = ruleCheck(q, allQuestions())
  const check = { rules, ai: null, aiError: null }
  if (!llmInfo().ready) {
    check.aiError = 'AI 설정이 없어 규칙 점검만 했어요.'
    return check
  }
  try {
    const { data, model } = await chatJson({ messages: buildCheckMessages(q), schema: CHECK_SCHEMA, schemaName: 'check' })
    check.ai = { reasons: Array.isArray(data.reasons) ? data.reasons.slice(0, 5) : [], model }
  } catch (err) {
    check.aiError = `AI 점검 실패: ${err.message}`
  }
  return check
}

// AI 초안의 근거 문장이 안내문에 정말 있는지 규칙으로 확인한다 (AI가 지어냈으면 표시)
function evidenceFound(evidence, text) {
  const squash = (s) => String(s ?? '').replace(/\s+/g, '')
  const e = squash(evidence)
  return e.length >= 6 && squash(text).includes(e)
}

const routes = {
  // 지금 서버 상태
  'GET /api/health': async () => ({
    ok: true,
    startedAt: STARTED_AT,
    ai: { ...llmInfo(), reachable: await pingModel() },
    admin: adminConfigured(),
    questions: allQuestions().filter((q) => q.status === 'approved').length,
  }),

  // 화면에서 쓰는 이름표 · 문제 수
  'GET /api/meta': async () => {
    const approved = allQuestions().filter((q) => q.status === 'approved')
    const counts = {}
    for (const q of approved) {
      counts[q.level] ??= { all: 0 }
      counts[q.level].all += 1
      counts[q.level][q.category] = (counts[q.level][q.category] ?? 0) + 1
    }
    return { levels: LEVELS, categories: CATEGORIES, counts, quizSize: QUIZ_SIZE, qualifyScore: QUALIFY_SCORE }
  },

  // 홈 화면 「최근 올라온 문제」: 공개된 문제의 제목만 (정답 · 해설은 빼고)
  'GET /api/recent': async () => {
    const list = allQuestions()
      .filter((q) => q.status === 'approved')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
      .map(({ id, level, category, question, author, origin, updatedAt }) => ({ id, level, category, question, author, origin, updatedAt }))
    return { questions: list }
  },

  // 퀴즈 문제 받기
  'GET /api/quiz': async (req, url) => {
    const level = url.searchParams.get('level')
    const category = url.searchParams.get('category') ?? 'all'
    if (!(level in LEVELS)) throw bad('난이도를 골라 주세요.')
    if (category !== 'all' && !(category in CATEGORIES)) throw bad('없는 분야예요.')
    // 정답은 서버 세션에만 두고, 화면에는 문제와 보기만 보낸다 (보안 점검 11/25)
    const questions = pickQuiz(allQuestions(), { level, category })
    const sessionId = createSession({ level, category, questions })
    return { sessionId, questions: questions.map(hideAnswer) }
  },

  // 한 문제 채점: 처음 고른 답만 기록하고 정답 · 해설 · 출처를 돌려준다
  'POST /api/answer': async (req) => {
    const { sessionId, id, choice } = await readJson(req)
    return answer(sessionId, id, choice)
  },

  // 재학생 버전 결과 → 서버가 기록한 첫 답으로만 판정, 80점 이상이면 출제 자격 표 (7일)
  'POST /api/qualify': async (req) => {
    const { sessionId } = await readJson(req)
    const result = finishSession(sessionId)
    const totalSenior = allQuestions().filter((q) => q.status === 'approved' && q.level === 'senior').length
    const { token, percent, exp } = issueQualification(result, totalSenior)
    return { token, percent, exp, grade: gradeOf(percent) }
  },

  // 재학생 문제 올리기 → 대기 (자격 표 1개당 1시간 5개, 대기 200개 넘으면 잠시 막음)
  'POST /api/questions': async (req) => {
    const body = await readJson(req)
    const qual = verifyQualification(body.token)
    const q = normalizeQuestion(body)
    checkSubmitLimit(qual.key, allQuestions().filter((x) => x.status === 'pending').length)
    const check = await checkSubmission(q)
    const [saved] = addQuestions([{ ...q, origin: 'student', status: 'pending', check }])
    return { id: saved.id, status: saved.status }
  },

  // ── 관리자 ──
  'POST /api/admin/login': async (req) => {
    const { password } = await readJson(req)
    return { token: login(password, req.socket.remoteAddress) }
  },

  'GET /api/admin/questions': async (req, url) => {
    requireAdmin(req)
    const status = url.searchParams.get('status')
    const list = allQuestions()
      .filter((q) => !status || q.status === status)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { questions: list }
  },

  // 관리자가 직접 추가 → 바로 공개
  'POST /api/admin/questions': async (req) => {
    requireAdmin(req)
    const q = normalizeQuestion(await readJson(req))
    const [saved] = addQuestions([{ ...q, origin: 'admin', status: 'approved' }])
    return { question: saved }
  },

  // 승인 · 반려 · 고쳐서 승인
  'POST /api/admin/review': async (req) => {
    requireAdmin(req)
    const { id, action, edit } = await readJson(req)
    const q = getQuestion(id)
    if (!q) throw bad('없는 문제예요.', 404)
    if (action === 'reject') return { question: updateQuestion(id, { status: 'rejected' }) }
    if (action !== 'approve') throw bad('action은 approve 또는 reject예요.')
    const patch = edit ? normalizeQuestion({ ...q, ...edit }) : {}
    return { question: updateQuestion(id, { ...patch, status: 'approved' }) }
  },

  'DELETE /api/admin/questions': async (req, url) => {
    requireAdmin(req)
    return { deleted: removeQuestion(url.searchParams.get('id')) }
  },

  // 공식 안내문 → AI 문제 초안 (대기로 저장, 근거 문장 확인 결과 포함)
  'POST /api/admin/draft': async (req) => {
    requireAdmin(req)
    const body = await readJson(req)
    const text = String(body.text ?? '').trim()
    if (text.length < 50) throw bad('안내문을 50자 이상 붙여 넣어 주세요.')
    if (text.length > MAX_SOURCE_TEXT) throw bad(`안내문이 너무 길어요. ${MAX_SOURCE_TEXT}자 이하로 나눠 넣어 주세요.`)
    if (!(body.level in LEVELS)) throw bad('난이도를 골라 주세요.')
    if (!(body.category in CATEGORIES)) throw bad('분야를 골라 주세요.')
    const source = String(body.source ?? '').trim().slice(0, 120) || '학교 공식 안내문'
    const count = Math.min(Math.max(Number(body.count) || 5, 1), 10)
    if (!llmInfo().ready) throw bad('AI 설정이 없어요. .env.local에 OPENROUTER_API_KEY와 OPENROUTER_MODEL을 넣어 주세요.', 503)

    const { data, model } = await chatJson({
      messages: buildDraftMessages({ text, level: body.level, categoryLabel: CATEGORIES[body.category], count }),
      schema: DRAFT_SCHEMA,
      schemaName: 'quiz_draft',
      timeoutMs: 180_000,
    })
    const drafts = []
    const skipped = []
    for (const raw of (data.questions ?? []).slice(0, count)) {
      try {
        const q = normalizeQuestion({ ...raw, level: body.level, category: body.category, source, author: 'AI 초안' })
        const found = evidenceFound(raw.evidence, text)
        const rules = ruleCheck(q, [...allQuestions(), ...drafts.map((d, i) => ({ ...d, id: `new${i}` }))])
        if (!found) rules.unshift('근거 문장이 안내문에서 그대로 찾아지지 않아요 — AI가 지어냈을 수 있어요')
        drafts.push({ ...q, origin: 'ai', status: 'pending', evidence: String(raw.evidence ?? '').slice(0, 300), check: { rules, ai: null, aiError: null, model } })
      } catch (err) {
        skipped.push(err.message)
      }
    }
    return { added: addQuestions(drafts).length, skipped, model }
  },

  // .env.local을 바꾼 뒤 다시 읽기 (npm run serve로 켰을 때만)
  'POST /api/restart': async (req) => {
    requireAdmin(req)
    if (!SUPERVISED) throw bad('npm run serve로 켰을 때만 다시 켤 수 있어요.')
    setTimeout(() => process.exit(RESTART_EXIT_CODE), 300)
    return { restarting: true }
  },
}

export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const handler = routes[`${req.method} ${url.pathname}`]
  if (!handler) return send(res, 404, { error: '없는 주소예요.' })
  try {
    send(res, 200, await handler(req, url))
  } catch (err) {
    if (!err.status || err.status >= 500) console.error(`[api] ${req.method} ${url.pathname}:`, err.message)
    send(res, err.status ?? 500, { error: err.message })
  }
}

// npm run server: API만 따로 켠다
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.API_PORT ?? 8787)
  createServer(handleApi).listen(port, () => console.log(`[api] http://localhost:${port}`))
}
