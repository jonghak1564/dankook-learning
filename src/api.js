// 서버(/api) 호출 모음. 접속 키는 서버에만 있고 여기에는 없다.

async function request(method, path, body, headers = {}) {
  const res = await fetch(path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error ?? `서버 오류 (${res.status}). npm run dev가 켜져 있는지 확인해 주세요.`)
    err.status = res.status
    throw err
  }
  return data
}

export const fetchMeta = () => request('GET', '/api/meta')
export const fetchQuiz = (level, category) =>
  request('GET', `/api/quiz?level=${level}&category=${category}`).then((d) => d.questions)
export const fetchRecent = () => request('GET', '/api/recent').then((d) => d.questions)
export const qualifyApi = (answers) => request('POST', '/api/qualify', { answers })
export const submitQuestionApi = (question, token) => request('POST', '/api/questions', { ...question, token })

// 출제 자격 표: 이 브라우저에만 저장 (로그인 대신)
const QUAL_KEY = 'dk-qualification'
export function loadQualification() {
  try {
    return JSON.parse(localStorage.getItem(QUAL_KEY)) ?? null
  } catch {
    return null
  }
}
export function saveQualification(q) {
  try {
    if (q) localStorage.setItem(QUAL_KEY, JSON.stringify(q))
    else localStorage.removeItem(QUAL_KEY)
  } catch {
    // 저장이 막힌 브라우저: 이번 화면에서만 자격 유지
  }
}

// 오답노트 · 내 기록: 이 브라우저에만 저장
function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장이 막힌 브라우저: 이번 화면에서만
  }
}
const NOTE_KEY = 'dk-wrong-notes'
const HISTORY_KEY = 'dk-history'
export const loadNotes = () => readJson(NOTE_KEY, [])
export const saveNotes = (notes) => writeJson(NOTE_KEY, notes.slice(0, 100))
export const loadHistory = () => readJson(HISTORY_KEY, [])
export const saveHistory = (list) => writeJson(HISTORY_KEY, list.slice(0, 20))

// ── 관리자 ──
const ADMIN_KEY = 'dk-admin-token'
export const getAdminToken = () => sessionStorage.getItem(ADMIN_KEY)
export const setAdminToken = (t) => (t ? sessionStorage.setItem(ADMIN_KEY, t) : sessionStorage.removeItem(ADMIN_KEY))
const admin = (method, path, body) => request(method, path, body, { 'x-admin-token': getAdminToken() ?? '' })

export const fetchHealth = () => request('GET', '/api/health')
export const adminLoginApi = (password) => request('POST', '/api/admin/login', { password }).then((d) => d.token)
export const adminListApi = (status) => admin('GET', `/api/admin/questions${status ? `?status=${status}` : ''}`).then((d) => d.questions)
export const adminAddApi = (question) => admin('POST', '/api/admin/questions', question)
export const adminReviewApi = (id, action, edit) => admin('POST', '/api/admin/review', { id, action, edit })
export const adminDeleteApi = (id) => admin('DELETE', `/api/admin/questions?id=${encodeURIComponent(id)}`)
export const adminDraftApi = (input) => admin('POST', '/api/admin/draft', input)
