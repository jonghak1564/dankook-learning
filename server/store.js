// 저장소: data/questions.json 파일 하나 (DB 없이). 서버를 다시 켜도 남는다
// 파일이 없으면 server/seed.js의 처음 문제로 만든다
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEED_QUESTIONS } from './seed.js'

const FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'questions.json')

let cache = null

function load() {
  if (cache) return cache
  if (existsSync(FILE)) {
    cache = JSON.parse(readFileSync(FILE, 'utf8'))
    // 새로 추가된 처음 문제(seed)만 더한다. 관리 페이지에서 지운 seed는 removedSeeds에 남아 다시 생기지 않는다
    const have = new Set(cache.questions.map((q) => q.id))
    const removed = new Set(cache.removedSeeds ?? [])
    const missing = SEED_QUESTIONS.filter((q) => !have.has(q.id) && !removed.has(q.id))
    // seed.js에서 고친 처음 문제는 따라 바꾼다. 단, 관리 페이지에서 손댄 것(updatedAt이 다름)은 그대로 둔다
    let changed = 0
    for (const seed of SEED_QUESTIONS) {
      const i = cache.questions.findIndex((q) => q.id === seed.id)
      if (i < 0) continue
      const cur = cache.questions[i]
      if (cur.updatedAt !== seed.updatedAt || cur.status !== seed.status) continue
      if (JSON.stringify(cur) !== JSON.stringify(seed)) {
        cache.questions[i] = { ...seed }
        changed += 1
      }
    }
    if (missing.length || changed) {
      cache.questions.push(...missing.map((q) => ({ ...q })))
      save()
    }
  } else {
    cache = { questions: SEED_QUESTIONS.map((q) => ({ ...q })) }
    save()
  }
  return cache
}

// 쓰는 도중 꺼져도 파일이 깨지지 않게: 임시 파일에 쓴 뒤 이름을 바꾼다
function save() {
  mkdirSync(dirname(FILE), { recursive: true })
  writeFileSync(`${FILE}.tmp`, JSON.stringify(cache, null, 2))
  renameSync(`${FILE}.tmp`, FILE)
}

export const newId = () => `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export function allQuestions() {
  return load().questions
}

export function getQuestion(id) {
  return load().questions.find((q) => q.id === id) ?? null
}

export function addQuestions(list) {
  const now = new Date().toISOString()
  const added = list.map((q) => ({ id: newId(), createdAt: now, updatedAt: now, ...q }))
  load().questions.push(...added)
  save()
  return added
}

export function updateQuestion(id, patch) {
  const q = getQuestion(id)
  if (!q) return null
  Object.assign(q, patch, { updatedAt: new Date().toISOString() })
  save()
  return q
}

export function removeQuestion(id) {
  const data = load()
  const before = data.questions.length
  data.questions = data.questions.filter((q) => q.id !== id)
  if (SEED_QUESTIONS.some((q) => q.id === id)) data.removedSeeds = [...new Set([...(data.removedSeeds ?? []), id])]
  save()
  return data.questions.length < before
}
