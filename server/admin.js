// 관리자 로그인: .env.local의 ADMIN_PASSWORD 하나. 없으면 관리 페이지가 잠긴다
// 로그인하면 표(token)를 주고 서버 메모리에 둔다 (서버를 다시 켜면 다시 로그인)
import { randomBytes, timingSafeEqual } from 'node:crypto'

const sessions = new Map() // token → 만료 시각
const TTL_MS = 12 * 60 * 60 * 1000
// 비밀번호 틀림은 접속 주소(IP)별로 센다 → 다른 사람이 일부러 틀려도 내 로그인은 잠기지 않는다
const failures = new Map() // ip → { count, lockedUntil }

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD)
}

export function login(password, ip = 'unknown') {
  if (!adminConfigured()) {
    throw Object.assign(new Error('관리자 비밀번호가 설정되지 않았어요. .env.local에 ADMIN_PASSWORD를 넣어 주세요.'), { status: 503 })
  }
  const f = failures.get(ip) ?? { count: 0, lockedUntil: 0 }
  if (Date.now() < f.lockedUntil) {
    throw Object.assign(new Error('여러 번 틀려서 잠깐 잠겼어요. 1분 뒤 다시 해 주세요.'), { status: 429 })
  }
  const a = Buffer.from(String(password ?? ''))
  const b = Buffer.from(process.env.ADMIN_PASSWORD)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    f.count += 1
    if (f.count >= 5) {
      f.lockedUntil = Date.now() + 60_000
      f.count = 0
    }
    failures.set(ip, f)
    if (failures.size > 10000) failures.delete(failures.keys().next().value)
    throw Object.assign(new Error('비밀번호가 맞지 않아요.'), { status: 401 })
  }
  failures.delete(ip)
  // 오래된 로그인 표 정리
  for (const [t, until] of sessions) if (until < Date.now()) sessions.delete(t)
  const token = randomBytes(24).toString('base64url')
  sessions.set(token, Date.now() + TTL_MS)
  return token
}

export function requireAdmin(req) {
  const token = req.headers['x-admin-token']
  const until = sessions.get(token)
  if (!until || until < Date.now()) {
    sessions.delete(token)
    throw Object.assign(new Error('관리자 로그인이 필요해요.'), { status: 401 })
  }
}
