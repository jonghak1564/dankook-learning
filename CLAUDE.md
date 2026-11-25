# CLAUDE.md — 개인 프로젝트 작업 지침

천안 AX 교육 **개인 프로젝트 「단국러닝」** — AI와 재학생이 함께 만드는 단국대 천안캠퍼스 퀴즈 (원종학, 공공정책학과 3학년 편입생).
기준 문서는 `docs/01_prd.md`. 팀프로젝트(`~/cheonan-ax-project`, 테크브리프)의 뼈대를 가져와 만들었다.
일정: 11/23 포스터(A2) 제출 · **11/27(금) 최종 코드 제출**

## 현재 코드

- 화면 `src/` (React 19 + Vite 8), API `server/` (Node 22, 별도 프레임워크 없이 Vite 미들웨어로 같은 포트에서 실행)
- 페이지 2개: `/` 퀴즈(`src/App.jsx`, 성격 유형 테스트식: 시작 → 한 문제씩 → 결과 카드), `/admin` 관리(`src/AdminApp.jsx`). 문제 입력 양식은 `src/QuestionForm.jsx` 하나를 같이 쓴다
- API 주소는 `server/index.js`의 `routes` 한 곳에 모은다
- 규칙(분야 · 난이도 · 입력 확인 · 금지어 · 개인정보 형식 · 비슷한 문제 · 등급 · 출제 자격 표)은 `server/questions.js`
- AI 호출은 `server/llm/client.js` **한 곳에서만** 한다. 지시문은 `server/llm/prompts.js` (안내문 → 문제 초안, 재학생 문제 1차 점검 두 가지뿐)
- 저장은 `server/store.js` → `data/questions.json` 파일 하나 (DB 없음, git에 안 올림). 파일이 없으면 `server/seed.js`로 만든다
- 관리자 로그인은 `server/admin.js` (`ADMIN_PASSWORD`), 출제 자격은 로그인 대신 서버가 서명한 표를 브라우저(localStorage)에 둔다
- 디자인: `src/tokens.css`(--tb-*) + 기본 부품 `src/ui/` + `src/App.css`(포스터와 같은 남색 #0b2a5b · 노랑 #f5c242. `ev-*` 공통 카드 · `mb-*` 테스트 화면)
- **지어낸 캠퍼스 정보를 문제 · 예시 · 시드에 넣지 않는다.** 사실은 본인 경험이나 학교 공식 안내문에서만

## 실행

- 공용 서버 계정 user05 → **포트 3005** (`PORT` 환경 변수). `npm run dev` 또는 `npm run serve`
- `.env.local`은 `.env.example`을 복사해 만든다. 바꾼 뒤에는 서버를 다시 켜야 반영된다 (`npm run serve`로 켰으면 `POST /api/restart`)
- 상태 확인: `curl -s localhost:3005/api/health` (AI 설정 · 연결, 관리자 비밀번호 설정 여부, 공개 문제 수)
- 다른 계정(팀원)의 프로세스 · 팀프로젝트 폴더는 건드리지 않는다

## 변경 작업 원칙 (팀프로젝트에서 이어 옴)

1. 규칙으로 할 수 있는 일은 규칙으로, 글을 읽고 쓰는 일만 AI에 맡긴다.
2. AI가 틀려도 알아챌 수 있게 근거 · "확인 필요" 표시를 남긴다.
3. AI 모델 · 주소는 `.env.local`로만 바꾼다. 코드에 모델 이름을 박지 않는다.
4. 새 외부 API를 붙이기 전에 약관 · 호출 한도 · 저장 가능 범위를 확인하고 01 PRD 「＋ 필요 데이터 · 제약」 칸에 날짜와 함께 적는다.
5. 키 · 비밀번호(`.env.local`)는 채팅 · 문서 · 커밋 · 화면 어디에도 그대로 출력하지 않는다.
6. 확인하지 않은 사실을 문서에 지어내지 않고 "미확인"으로 적는다.

## 검증 · 완료 조건

- `npm run lint`와 `npm run build`가 통과한다.
- 바꾼 화면을 브라우저에서 확인하는 방법(주소 · 눌러 볼 것)을 알려 준다.
- 관련 문서(01 · 06 · 07 · README)를 같이 고친다.

## Git

- 개인 저장소라 main에서 작업해도 되지만, 큰 기능은 `feature/기능이름` branch를 권장한다.
- commit은 요청할 때, push는 확인받은 뒤에만 한다. force push는 하지 않는다.

## 문서

- PRD `docs/01_prd.md` · 벤치마킹 `docs/02_benchmarking.md` · GPT 문제 파밍 지시문 `docs/03_gpt_farming_prompt.md`(결과는 `docs/farm/`, `npm run import-questions`로 검수 대기에 넣음) · 와이어프레임 `docs/06_wireframe.md` · 할 일 `docs/07_todo.md` · 실행 방법 `README.md`
- 큰 변경 전 버전은 `docs/archive/<이름>_<YYYYMMDD>.md`로 옮긴다.
