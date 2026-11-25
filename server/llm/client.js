// AI 모델 호출은 이 파일에서만 한다. 모델을 바꿀 때는 .env.local 값만 바꾼다 (코드에 모델 이름을 박지 않는다)
// OpenAI 호환 /chat/completions 주소를 쓰므로 Ollama(맥미니)와 OpenRouter 모두 같은 코드로 부른다.
// 팀프로젝트(server/llm/client.js)에서 가져와 줄였다: 우선순위 끊기·사용 현황 기록은 뺐다

const TIMEOUT_MS = 120_000
const PROVIDER_IDS = ['local', 'openrouter']

function providerConfig(id) {
  if (id === 'openrouter') {
    return {
      id,
      label: 'OpenRouter',
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL,
      numCtx: 0,
      pingPath: '/key', // OpenRouter의 /models는 키 없이도 열려 있어 키 확인용 주소를 쓴다
      envHint: 'OPENROUTER_API_KEY, OPENROUTER_MODEL',
    }
  }
  return {
    id: 'local',
    label: '맥미니',
    baseUrl: process.env.LLM_BASE_URL,
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL,
    numCtx: Number(process.env.LLM_NUM_CTX) || 0,
    pingPath: '/models',
    envHint: 'LLM_BASE_URL, LLM_API_KEY, LLM_MODEL',
  }
}

const isReady = (c) => Boolean(c.baseUrl && c.apiKey && c.model)

function currentId() {
  const wanted = process.env.LLM_PROVIDER
  if (PROVIDER_IDS.includes(wanted)) return wanted
  return PROVIDER_IDS.find((id) => isReady(providerConfig(id))) ?? 'local'
}

function config() {
  const c = providerConfig(currentId())
  if (!isReady(c)) throw new Error(`${c.label} AI 설정이 없어요. .env.local에 ${c.envHint}를 넣어 주세요.`)
  return { ...c, baseUrl: c.baseUrl.replace(/\/$/, '') }
}

// 맥미니 메모리가 넉넉하지 않아 요청을 한 번에 하나씩 보낸다 (먼저 온 순서)
let chain = Promise.resolve()
function enqueue(task) {
  const run = chain.then(task, task)
  chain = run.catch(() => {})
  return run
}

async function post(url, apiKey, body, timeoutMs) {
  const send = () =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
  let res
  try {
    res = await send()
  } catch (err) {
    // 연결이 순간 끊긴 경우만 2초 뒤 한 번 더. 시간 초과는 다시 보내지 않는다
    if (err.name === 'TimeoutError') throw err
    console.warn(`[llm] 연결 실패, 다시 시도: ${err.message}`)
    await new Promise((r) => setTimeout(r, 2000))
    res = await send()
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`AI 서버 응답 오류 ${res.status} ${detail.slice(0, 200)}`)
  }
  return res.json()
}

async function callChat({ messages, schema, schemaName, timeoutMs }) {
  const { id, baseUrl, apiKey, model, numCtx } = config()
  // Ollama는 /v1으로 부르면 입력을 약 2,000토큰까지만 읽는다 → LLM_NUM_CTX가 있으면 원래 API(/api/chat)로
  if (numCtx) {
    const body = { model, messages, stream: false, think: false, options: { num_ctx: numCtx, temperature: 0.2 } }
    if (schema) body.format = schema
    const data = await post(`${baseUrl.replace(/\/v1$/, '')}/api/chat`, apiKey, body, timeoutMs)
    return { content: data.message?.content ?? '', model }
  }
  const body = { model, messages, temperature: 0.2 }
  if (schema) {
    body.response_format = { type: 'json_schema', json_schema: { name: schemaName, schema } }
    if (id === 'openrouter') body.provider = { require_parameters: true }
  }
  const data = await post(`${baseUrl}/chat/completions`, apiKey, body, timeoutMs)
  return { content: data.choices?.[0]?.message?.content ?? '', model }
}

// 질문을 보내고 JSON으로 받는다 (schema: JSON Schema)
export function chatJson({ messages, schema, schemaName = 'result', timeoutMs = TIMEOUT_MS }) {
  return enqueue(async () => {
    const { content, model } = await callChat({ messages, schema, schemaName, timeoutMs })
    try {
      // 일부 모델은 JSON을 ```json … ``` 으로 감싸 보낸다
      return { data: JSON.parse(content.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')), model }
    } catch {
      throw new Error('AI 응답이 JSON 형식이 아니에요.')
    }
  })
}

export function llmInfo() {
  const c = providerConfig(currentId())
  return { provider: c.label, model: c.model ?? '', ready: isReady(c) }
}

// 지금 AI 서버에 닿는지 짧게 확인한다
export async function pingModel() {
  try {
    const { baseUrl, apiKey, pingPath } = config()
    const res = await fetch(`${baseUrl}${pingPath}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(6000),
    })
    return res.ok
  } catch {
    return false
  }
}
