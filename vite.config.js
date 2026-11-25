import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// ── 보안 (11/25 점검) ──
// 1) 이 컴퓨터 안(localhost)에서 온 접속만 받는다. VS Code 포트 전달도 localhost로 들어온다.
//    학원 내부망의 다른 컴퓨터에서 직접 들어오는 것은 막는다 (ALLOW_NETWORK=1이면 허용)
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
// 2) 화면에 필요 없는 파일은 주소로 열 수 없게 막는다: 문제 데이터(정답 · 검수 대기), 서버 코드, 문서, 설정
const BLOCKED = [
  /^\/(data|server|scripts|docs|\.claude|\.storybook|\.git|dist)(\/|$)/,
  /^\/[^/]+\.(md|json|lock|mjs|cjs|log)$/i, // 맨 위의 README.md · package.json 등
  /^\/(vite\.config\.js|\.oxlintrc\.json|\.gitignore)$/,
  /(^|\/)\.env/i,
]

function blockedPath(rawUrl, root) {
  let path = (rawUrl ?? '/').split('?')[0]
  try {
    path = decodeURIComponent(path)
  } catch {
    return true
  }
  path = path.replace(/\\/g, '/').replace(/\/{2,}/g, '/')
  if (path.includes('/../') || path.endsWith('/..')) return true
  // /@fs/<프로젝트 폴더>/... 로 돌려서 여는 것도 같은 규칙으로 본다
  const fsRoot = `/@fs${root}`
  if (path.startsWith(fsRoot)) path = path.slice(fsRoot.length) || '/'
  return BLOCKED.some((re) => re.test(path))
}

// 3) 기본 보안 헤더 (다른 사이트가 우리 화면을 몰래 띄우기 · 파일 종류 속이기 · 주소 새기 방지)
const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// API(/api)를 Vite 개발 서버 안에서 같이 연다 → npm run dev 하나, 포트 하나
function appApi() {
  return {
    name: 'app-api',
    async configureServer(server) {
      const { handleApi } = await import('./server/index.js')
      const root = server.config.root.replace(/\\/g, '/')
      server.middlewares.use((req, res, next) => {
        for (const [k, v] of Object.entries(HEADERS)) res.setHeader(k, v)
        if (process.env.ALLOW_NETWORK !== '1' && !LOOPBACK.has(req.socket.remoteAddress)) {
          res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
          return res.end('이 컴퓨터 밖에서는 접속할 수 없어요. VS Code 포트 전달로 접속해 주세요.')
        }
        if (blockedPath(req.url, root)) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
          return res.end('없는 주소예요.')
        }
        if (!req.url?.startsWith('/api/')) return next()
        handleApi(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env.local의 값(접속 키 포함)을 서버 쪽에서만 쓰도록 process.env에 넣는다. 브라우저 코드로는 가지 않는다
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    process.env[key] ??= value
  }
  return {
    plugins: [react(), appApi()],
    server: {
      // 공용 서버에서는 계정마다 배정된 PORT를 쓴다 (예: user05 → 3005)
      port: Number(process.env.PORT ?? 5173),
      strictPort: true,
      // 비밀 파일은 Vite도 열지 않게 (위 BLOCKED와 이중으로)
      fs: { strict: true, deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**'] },
    },
  }
})
