# 단국러닝 — 천안캠퍼스 고인물 테스트

AI와 재학생이 함께 만드는 단국대 천안캠퍼스 퀴즈. 천안 AX 교육 개인 프로젝트 (원종학, 공공정책학과 3학년).
기획: [docs/01_prd.md](docs/01_prd.md)

## 기능

| 기능 | 설명 |
| :-- | :-- |
| 퀴즈 풀기 | 성격 유형 테스트처럼 시작 → 한 문제씩 → 결과 카드. 신·편입생(배우기) / 재학생(고인물 도전), 해설 · 출처, 보기 순서 섞기, 결과 공유, 틀린 문제 해설 · 틀린 것만 다시 |
| 등급 · 출제 자격 | 재학생 버전 뉴비 › 새내기 › 화석 › 고인물. 80점 이상이면 출제 자격 (서버가 다시 채점해 서명한 표를 브라우저에 저장) |
| 문제 올리기 | 출제 자격이 있으면 닉네임만으로. 해설 · 출처 필수 → 검수 대기 |
| 검수 (/admin) | 규칙 점검(금지어 · 개인정보 형식 · 비슷한 문제) + AI 1차 점검 결과를 보고 승인 · 고쳐서 승인 · 반려 |
| AI 초안 (/admin) | 학교 공식 안내문을 붙여 넣으면 AI가 그 글만 근거로 문제 초안. 근거 문장이 안내문에 그대로 없으면 「확인 필요」 |
| 직접 추가 (/admin) | 관리자가 확인한 문제를 바로 공개 |

## 실행

```bash
npm install
cp .env.example .env.local   # ADMIN_PASSWORD, OPENROUTER_API_KEY, OPENROUTER_MODEL 채우기
npm run serve                # http://<서버주소>:3005  (관리: /admin)
npm run lint && npm run build
npm run import-questions -- docs/farm/gpt_1125.md   # GPT가 모은 문제 → 검수 대기 (서버 끈 상태에서)
```

GPT로 문제 모으기: [docs/03_gpt_farming_prompt.md](docs/03_gpt_farming_prompt.md)를 복사해 ChatGPT(웹 검색 켜기)에 붙여 넣고, 답을 `docs/farm/`에 저장한 뒤 위 명령으로 넣는다.

AI 설정이 없어도 퀴즈 · 올리기 · 검수는 동작한다 (AI 초안만 안 되고, 점검은 규칙만).

## 구조

```
src/App.jsx           퀴즈 · 결과 · 문제 올리기
src/AdminApp.jsx      관리: 검수 · AI 초안 · 직접 추가 · 전체 문제
src/QuestionForm.jsx  문제 입력 양식 (같이 씀)
server/index.js       API 주소 (routes)
server/questions.js   규칙: 입력 확인 · 금지어 · 비슷한 문제 · 등급 · 출제 자격
server/store.js       data/questions.json 저장 (처음엔 server/seed.js)
server/admin.js       관리자 로그인
server/llm/           AI 호출(client.js) · 지시문(prompts.js)
```

## API

| 주소 | 설명 |
| :-- | :-- |
| `GET /api/health` | AI · 관리자 설정 · 공개 문제 수 |
| `GET /api/meta` | 난이도 · 분야 이름, 분야별 문제 수 |
| `GET /api/quiz?level=&category=` | 퀴즈 10문제 + 세션 (정답 · 해설은 안 보냄) |
| `POST /api/answer` | 한 문제 채점 (첫 답만 기록) → 정답 · 해설 · 출처 |
| `POST /api/qualify` | 세션 기록으로 판정, 재학생 80점 이상이면 출제 자격 표 (7일) |
| `POST /api/questions` | 문제 올리기 (출제 자격 표 필요, 1시간 5개) → 검수 대기 |
| `POST /api/admin/login` | 관리자 로그인 |
| `GET/POST/DELETE /api/admin/questions` | 문제 목록 · 직접 추가 · 삭제 |
| `POST /api/admin/review` | 승인 · 고쳐서 승인 · 반려 |
| `POST /api/admin/draft` | 안내문 → AI 문제 초안 |
| `POST /api/restart` | `.env.local` 다시 읽기 (관리자, `npm run serve`일 때) |
