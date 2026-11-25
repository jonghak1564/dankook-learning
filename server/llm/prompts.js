// AI 지시문 모음. 지시문은 여기에만 두고 server/index.js에서 불러다 쓴다
// AI는 ① 안내문 → 문제 초안 ② 재학생 문제 1차 점검 두 가지만 한다. 승인은 항상 사람 (01 PRD)

const LEVEL_TEXT = {
  newbie: '신·편입생용: 꼭 알아야 할 기본 정보. 쉽고 분명하게',
  senior: '재학생용: 학교를 잘 아는 사람도 헷갈릴 만한 디테일',
}

// ① 학교 공식 안내문 → 퀴즈 초안
export function buildDraftMessages({ text, level, categoryLabel, count }) {
  return [
    {
      role: 'system',
      content: [
        '너는 단국대학교 천안캠퍼스 신입생 안내 퀴즈를 만드는 도우미다. 한국어로만 쓴다.',
        '규칙:',
        '- 사용자가 준 안내문에 적힌 사실만 쓴다. 안내문에 없는 내용, 너의 일반 지식, 추측은 절대 쓰지 않는다.',
        '- 문제마다 evidence에 근거가 된 안내문 문장을 **글자 그대로** 복사해 넣는다. 고치거나 요약하지 않는다.',
        '- type은 "ox" 또는 "choice". ox면 choices는 ["O","X"], answer는 O=0, X=1.',
        '- choice면 choices는 서로 다른 보기 4개, answer는 정답 보기의 번호(0~3). 오답 보기도 그럴듯하게.',
        '- explanation은 정답의 이유를 1~2문장으로, 신입생이 읽고 바로 알 수 있게 쓴다.',
        '- 안내문으로 만들 문제가 부족하면 개수를 줄인다. 억지로 채우지 않는다.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `난이도: ${LEVEL_TEXT[level]}\n분야: ${categoryLabel} (이 분야에 맞는 내용으로)\n문제 수: 최대 ${count}개\n\n[안내문]\n${text}`,
    },
  ]
}

export const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['ox', 'choice'] },
          question: { type: 'string' },
          choices: { type: 'array', items: { type: 'string' } },
          answer: { type: 'integer' },
          explanation: { type: 'string' },
          evidence: { type: 'string' },
        },
        required: ['type', 'question', 'choices', 'answer', 'explanation', 'evidence'],
      },
    },
  },
  required: ['questions'],
}

// ② 재학생이 올린 문제 1차 점검 (사실 여부는 AI도 모르므로 묻지 않는다)
export function buildCheckMessages(q) {
  const choices = q.choices.map((c, i) => `${i + 1}) ${c}`).join(' ')
  return [
    {
      role: 'system',
      content: [
        '너는 대학 캠퍼스 퀴즈에 올라온 문제를 검수 전에 점검하는 도우미다. 한국어로 답한다.',
        '아래만 본다. 문제 내용이 사실인지는 판단하지 않는다 (관리자가 확인한다).',
        '- personal: 실명 · 연락처 · 특정인을 알아볼 수 있는 정보가 있는가',
        '- offensive: 욕설 · 비하 · 놀림 · 혐오 표현이 있는가',
        '- unclear: 문제나 정답이 애매해서 정답이 둘 이상일 수 있는가',
        '- weakExplanation: 해설이 정답의 이유를 설명하지 못하는가',
        'reasons에는 문제가 있는 항목만 짧은 문장으로 적는다. 없으면 빈 배열.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `문제: ${q.question}\n보기: ${choices}\n정답: ${q.choices[q.answer]}\n해설: ${q.explanation}\n출처: ${q.source}`,
    },
  ]
}

export const CHECK_SCHEMA = {
  type: 'object',
  properties: {
    personal: { type: 'boolean' },
    offensive: { type: 'boolean' },
    unclear: { type: 'boolean' },
    weakExplanation: { type: 'boolean' },
    reasons: { type: 'array', items: { type: 'string' } },
  },
  required: ['personal', 'offensive', 'unclear', 'weakExplanation', 'reasons'],
}
