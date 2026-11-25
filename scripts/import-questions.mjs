// GPT 등에서 모아 온 문제 파일(.md 안의 ```json 블록)을 「검수 대기」로 넣는다 (docs/03_gpt_farming_prompt.md)
// 사용: npm run import-questions -- docs/farm/gpt_1125.md
// - 바로 공개하지 않는다. 관리 페이지(/admin) 검수 대기에서 출처를 확인하고 승인한다
// - 서버가 켜져 있으면 멈춘다 (서버가 들고 있는 문제 목록과 파일이 어긋나 덮어쓸 수 있어서)
import { readFileSync } from 'node:fs'
import { normalizeQuestion, ruleCheck } from '../server/questions.js'
import { addQuestions, allQuestions } from '../server/store.js'

const file = process.argv[2]
if (!file) {
  console.error('사용법: npm run import-questions -- docs/farm/파일이름.md')
  process.exit(1)
}

const port = process.env.PORT ?? 5173
const running = await fetch(`http://localhost:${port}/api/health`, { signal: AbortSignal.timeout(1500) })
  .then(() => true)
  .catch(() => false)
if (running) {
  console.error(`서버가 켜져 있어요 (포트 ${port}). 서버를 끈 뒤 다시 실행해 주세요.`)
  process.exit(1)
}

const text = readFileSync(file, 'utf8')
const blocks = [...text.matchAll(/```json\s*([\s\S]*?)```/g)].map((m) => m[1])
if (!blocks.length) {
  console.error('```json 블록을 찾지 못했어요. GPT 답을 코드 블록째로 붙여 넣었는지 확인해 주세요.')
  process.exit(1)
}

const items = []
for (const b of blocks) {
  try {
    const data = JSON.parse(b)
    items.push(...(Array.isArray(data) ? data : data.questions ?? []))
  } catch (err) {
    console.error(`JSON 형식 오류: ${err.message}`)
  }
}

const added = []
const skipped = []
for (const [i, raw] of items.entries()) {
  try {
    const q = normalizeQuestion({ ...raw, author: 'GPT 조사' })
    const rules = ruleCheck(q, [...allQuestions(), ...added.map((a, j) => ({ ...a, id: `new${j}` }))])
    if (!/https?:\/\//.test(q.source)) rules.unshift('출처에 주소(URL)가 없어요 — 확인할 수 없으면 반려')
    if (!String(raw.quote ?? '').trim()) rules.unshift('출처 문장(quote)이 없어요')
    added.push({
      ...q,
      origin: 'gpt',
      status: 'pending',
      evidence: String(raw.quote ?? '').slice(0, 300),
      check: { rules, ai: null, aiError: 'GPT가 모은 문제예요. 출처 링크를 열어 근거 문장을 직접 확인하세요.' },
    })
  } catch (err) {
    skipped.push(`${i + 1}번 「${String(raw?.question ?? '').slice(0, 30)}」: ${err.message}`)
  }
}

addQuestions(added)
console.log(`검수 대기에 ${added.length}개를 넣었어요. (파일: ${file})`)
const flagged = added.filter((q) => q.check.rules.length)
if (flagged.length) console.log(`그중 ${flagged.length}개는 「확인 필요」 표시가 붙었어요 (비슷한 문제 · 출처 없음 등).`)
if (skipped.length) console.log(`형식이 맞지 않아 뺀 것 ${skipped.length}개:\n- ${skipped.join('\n- ')}`)
console.log('관리 페이지(/admin) 「검수 대기」에서 확인 후 승인하세요.')
