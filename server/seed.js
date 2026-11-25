// 처음 문제. 사실 확인이 된 것만 넣는다 (지어낸 캠퍼스 정보 금지 — 01 PRD 「필요 데이터 · 제약」)
// 출처: 단국대 공식 홈페이지 (2026-11-23 Claude가 페이지를 직접 읽어 확인). 학기마다 바뀌는 셔틀 시간 · 가게 이름은 넣지 않았다
// 더 넣을 문제는 관리 페이지(/admin)의 「직접 추가」나 「AI 초안」으로 넣는다
// data/questions.json에 없는 id만 켤 때 더해진다 (server/store.js). 고칠 때는 id를 그대로 두고 관리 페이지에서 고친다

const CHECKED = '2026-11-23 확인'
const SRC = {
  shuttle: `단국대 홈페이지 > 셔틀버스 (dankook.ac.kr/ko/-334, ${CHECKED})`,
  way: `단국대 홈페이지 > 오시는 길 (dankook.ac.kr/ko/-67, ${CHECKED})`,
  facility: `단국대 홈페이지 > 천안 편의시설 (dankook.ac.kr/ko/web/kor/-526, ${CHECKED})`,
  course: `단국대 홈페이지 > 수강신청 (dankook.ac.kr/ko/web/kor/-452, ${CHECKED})`,
  grade: `단국대 홈페이지 > 성적 (dankook.ac.kr/ko/web/kor/-462, ${CHECKED})`,
  certify: `단국대 홈페이지 > 졸업인증 (dankook.ac.kr/ko/web/kor/-463, ${CHECKED})`,
  graduate: `단국대 홈페이지 > 졸업 (dankook.ac.kr/ko/web/kor/thesis, ${CHECKED})`,
  transfer: `단국대 홈페이지 > 캠퍼스간 전부(과) (dankook.ac.kr/ko/web/kor/-64, ${CHECKED})`,
  history: `단국대 홈페이지 > 약사 (dankook.ac.kr/ko/web/kor/-34, ${CHECKED})`,
  symbol: `단국대 홈페이지 > 상징 (dankook.ac.kr/ko/web/kor/-36, ${CHECKED})`,
}
// 규정집 원문 (rule.dankook.ac.kr, 두 캠퍼스 공통 규정. 2026-11-25 확인)
const CHECKED2 = '2026-11-25 확인'
const RULE = {
  hak: (n) => `단국대 학칙 제${n}조 (rule.dankook.ac.kr, ${CHECKED2})`,
  sehak: (n) => `학칙 시행세칙 제${n}조 (rule.dankook.ac.kr, ${CHECKED2})`,
  season: (n) => `정규학기 이외의 수업에 관한 규정 제${n}조 (rule.dankook.ac.kr, ${CHECKED2})`,
  scholar: (n) => `장학금 지급 규정 제${n}조 (rule.dankook.ac.kr, ${CHECKED2})`,
  org: (n) => `직제규정 제${n}조 (rule.dankook.ac.kr, ${CHECKED2})`,
  register: `단국대 홈페이지 > 휴·복학 (dankook.ac.kr/ko/register1, ${CHECKED2})`,
  tuition: `단국대 홈페이지 > 등록금 분할납부 (dankook.ac.kr/ko/tuition1, ${CHECKED2})`,
}
const LIFE = {
  idea: `단국대 홈페이지 > 교육이념 (dankook.ac.kr/ko/-33, ${CHECKED2})`,
  founder: `단국대 홈페이지 > 설립자 (dankook.ac.kr/ko/-32, ${CHECKED2})`,
  talent: `단국대 홈페이지 > 인재상 (dankook.ac.kr/ko/-571, ${CHECKED2})`,
  ui: `단국대 홈페이지 > UI (dankook.ac.kr/web/kor/-ui-, ${CHECKED2})`,
  cheonan: `단국대 홈페이지 > 천안캠퍼스 조직 · 위치 (dankook.ac.kr/ko/-512, ${CHECKED2})`,
  facility: `단국대 홈페이지 > 천안 편의시설 (dankook.ac.kr/web/kor/-526, ${CHECKED2}, 바뀔 수 있음)`,
  lounge: `단국대 공식 웹진 2026-04-03 (webzine.dankook.ac.kr/news/articleView.html?idxno=964, ${CHECKED2})`,
  gate: `[2차] 아이뉴스24 2026-11-11 (inews24.com/view/2025244, ${CHECKED2})`,
}
// GPT 조사 (docs/farm/gpt_1125.md, 11/25 기획자 검토 후 추가). 출처는 GPT가 적어 온 페이지
const GPT = {
  facility: `단국대 홈페이지 > 천안 복지시설 (dankook.ac.kr/-526, ${CHECKED2}, GPT 조사, 바뀔 수 있음)`,
  cheonan: `단국대 홈페이지 > 천안캠퍼스 학생지원 부서 (dankook.ac.kr/ko/-512, ${CHECKED2}, GPT 조사)`,
  shuttle: `단국대 홈페이지 > 셔틀버스 (dankook.ac.kr/ko/web/kor/-334, ${CHECKED2}, GPT 조사)`,
  card: `단국대 홈페이지 > 모바일 학생증 (dankook.ac.kr/web/kor/-469, ${CHECKED2}, GPT 조사)`,
  support: `단국대 장애학생지원센터 > 센터 안내 (cms.dankook.ac.kr/ko/web/supportcenter/introduce, ${CHECKED2}, GPT 조사)`,
  breakfast: `단국대 DKU Today > 천원의 아침밥 사업 (cms.dankook.ac.kr/web/kor/dku-today, ${CHECKED2}, GPT 조사 · 현재 운영은 재학생 확인)`,
  symbol: `단국대 홈페이지 > 교기 · 상징물 (dankook.ac.kr/-36, ${CHECKED2}, GPT 조사)`,
  museum: `단국역사관 > 이달의 기록물 2024-11 「천안캠퍼스의 시작」 (cms.dankook.ac.kr/web/historymuseum, ${CHECKED2}, GPT 조사)`,
  report: `단국대 2017 대학기관평가인증 자체진단평가보고서 14쪽 (dankook.ac.kr, ${CHECKED2}, GPT 조사)`,
  rule56: `학칙 시행세칙 제56조 제2항 (rule.dankook.ac.kr, ${CHECKED2}, GPT 조사)`,
}
const gpt = (q) => ({ ...q, origin: 'gpt', author: 'GPT 조사' })

const AT = '2026-11-23T00:00:00.000Z'
const base = { origin: 'seed', status: 'approved', author: '단국러닝', createdAt: AT, updatedAt: AT }
const ox = (id, level, category, question, isO, explanation, source) => ({
  ...base,
  id,
  level,
  category,
  type: 'ox',
  question,
  choices: ['O', 'X'],
  answer: isO ? 0 : 1,
  explanation,
  source,
})
const pick = (id, level, category, question, choices, answer, explanation, source) => ({
  ...base,
  id,
  level,
  category,
  type: 'choice',
  question,
  choices,
  answer,
  explanation,
  source,
})

export const SEED_QUESTIONS = [
  // ── 기획자 본인 제보 ──
  {
    ...ox(
      'seed-1',
      'newbie',
      'food',
      '학식은 학생회관에서만 먹을 수 있다?',
      false,
      '치과대학에도 학식이 있어요. 학생회관만 있는 줄 알면 놓치기 쉬워요. (학교 편의시설 안내에는 학생회관 3층 식당만 나와 있어요)',
      '재학생 제보 (공공정책학과 편입생)',
    ),
    author: '원종학',
  },

  // ── 신·편입생: 셔틀 · 교통 ──
  pick('seed-t1', 'newbie', 'transport', '학교 셔틀버스가 다니지 않는 곳은?', ['두정역', '천안역', '천안터미널', '아산역'], 3, '셔틀은 학교 ↔ 두정역 · 천안역 · 천안터미널 구간을 운행해요. 아산역 노선은 공식 안내에 없어요.', SRC.shuttle),
  ox('seed-t2', 'newbie', 'transport', '셔틀버스는 방학과 공휴일에도 운행한다?', false, '하계 · 동계 방학과 공휴일에는 운행하지 않아요. 방학 때는 시내버스를 이용하세요.', SRC.shuttle),
  pick('seed-t3', 'newbie', 'transport', '학교에서 두정역 · 천안역 · 터미널로 가는 하교 셔틀은 어디서 탈까?', ['학생회관 1층 앞', '율곡기념도서관 앞', '단우홀 앞', '정문 버스정류장'], 0, '하교 셔틀은 세 노선 모두 학생회관 1층 앞에서 출발해요. (탑승 위치는 학기마다 공지를 한 번 더 확인하세요)', SRC.shuttle),
  pick('seed-t4', 'newbie', 'transport', '두정역 · 천안터미널 · 천안역에서 학교로 오는 시내버스 번호는?', ['11번', '1번', '24번', '100번'], 0, '세 곳 모두 11번 시내버스로 학교에 올 수 있어요. 두정역에서는 내려서 횡단보도 건너편 정류장에서 타요.', SRC.way),
  ox('seed-t5', 'newbie', 'transport', '천안역에서 등교 셔틀은 동부광장 맞은편에서 탄다?', true, '천안역 등교 셔틀은 천안역 동부광장 맞은편에서 타요. 두정역은 「셔틀버스 환승시설」에서 타요.', SRC.shuttle),

  // ── 신·편입생: 학사 제도 ──
  pick('seed-a1', 'newbie', 'academic', '한 학기에 기본으로 수강신청할 수 있는 최대 학점은?', ['19학점', '18학점', '21학점', '24학점'], 0, '매 학기 19학점 이내예요. 직전 학기 평점이 4.0 이상이면 3학점을 더 신청할 수 있어요.', SRC.course),
  pick('seed-a2', 'newbie', 'academic', '졸업하려면 재학 중 사회봉사를 몇 시간 해야 할까?', ['32시간', '20시간', '40시간', '60시간'], 0, '재학 중 사회봉사 32시간(현장봉사 + 온라인특강)을 이수해야 해요.', SRC.graduate),
  ox('seed-a3', 'newbie', 'academic', 'C+를 받은 과목은 재수강할 수 있다?', true, 'C+ 이하일 때 재수강할 수 있어요. 단, 한 학기 재수강은 최대 6학점까지예요.', SRC.grade),
  pick('seed-a4', 'newbie', 'academic', '수강신청 전에 듣고 싶은 과목을 미리 담아 두는 웹정보시스템 기능은?', ['수강계획도우미', '강의평가', '학점계산기', '이수사정시뮬레이션'], 0, '웹정보시스템의 「수강계획도우미」에 수강희망 과목을 미리 담아 둘 수 있어요(장바구니 기능).', SRC.course),
  ox('seed-a5', 'newbie', 'academic', '편입생도 조기졸업을 신청할 수 있다?', false, '편입학생은 조기졸업 대상에서 제외돼요. 편입생이라면 꼭 알아 두세요.', SRC.graduate),
  ox('seed-a6', 'newbie', 'academic', '졸업인증 기준을 채우지 못하면 졸업이 아니라 수료로 처리된다?', true, '졸업인증 기준 미달자는 수료로 처리돼요. 편입생은 2009학년도 편입학자부터 적용돼요.', SRC.certify),
  pick('seed-a7', 'newbie', 'academic', '3학년이 성적장학금을 받으려면 한 학기에 최소 몇 학점을 신청해야 할까?', ['15학점', '12학점', '18학점', '9학점'], 0, '1 · 2 · 3학년은 15학점 이상, 4학년은 12학점 이상 신청해야 성적장학금을 받을 수 있어요.', SRC.course),

  // ── 신·편입생: 학식 · 편의시설 ──
  pick('seed-f1', 'newbie', 'food', '학생회관 3층에 있는 학생식당의 이름은?', ['1947_commons', '단국키친', '곰마루 식당', '율곡식당'], 0, '학생식당 「1947_commons」는 학생회관 3층에 있고 500석 규모예요. 1947은 단국대가 처음 문을 연 해예요.', SRC.facility),

  // ── 신·편입생: 건물 · 시설 ──
  pick('seed-c1', 'newbie', 'campus', '천안캠퍼스 도서관의 이름은?', ['율곡기념도서관', '퇴계기념중앙도서관', '단군기념도서관', '천안중앙도서관'], 0, '천안캠퍼스 도서관은 율곡기념도서관이에요. 퇴계기념중앙도서관은 죽전캠퍼스에 있어요.', SRC.facility),
  pick('seed-c2', 'newbie', 'campus', '아플 때 가는 대학진료소는 어디에 있을까?', ['학생회관(극장동) 3층', '율곡기념도서관 1층', '단우홀 1층', '치과대학 1층'], 0, '대학진료소는 학생회관(극장동) 3층에 있어요.', SRC.facility),

  // ── 신·편입생: 역사 · 기타 ──
  pick('seed-e1', 'newbie', 'etc', '천안캠퍼스가 문을 연(개교식) 해는?', ['1978년', '1947년', '1988년', '1967년'], 0, '천안캠퍼스는 1978년 3월 개교식을 했어요. 1947년은 단국대가 서울에서 처음 개교한 해예요.', SRC.history),
  pick('seed-e2', 'newbie', 'etc', '단국대의 상징동물은?', ['검은 곰', '호랑이', '독수리', '백마'], 0, '상징동물은 검은 곰이에요. 단군신화를 바탕으로 인내와 용기를 상징해요.', SRC.symbol),

  // ── 재학생(고인물): 디테일 ──
  ox('seed-s1', 'senior', 'academic', '편입생은 캠퍼스간 전부(과)에 지원할 수 없다?', true, '편입학한 학생은 캠퍼스간 전부(과) 지원 대상이 아니에요.', SRC.transfer),
  pick('seed-s2', 'senior', 'academic', '한 학기에 재수강할 수 있는 최대 학점은?', ['6학점', '3학점', '9학점', '제한 없음'], 0, '재수강은 C+ 이하 과목만, 한 학기 최대 6학점까지예요.', SRC.grade),
  pick('seed-s3', 'senior', 'academic', '졸업 가능 여부를 미리 확인하는 웹정보시스템 메뉴는?', ['성적 › 이수(졸업)사정시뮬레이션', '수업 › 수강계획도우미', '등록 › 졸업예정조회', '학적 › 졸업인증현황'], 0, '웹정보시스템 → 성적 메뉴 → 「이수(졸업)사정시뮬레이션」에서 확인해요.', SRC.course),
  pick('seed-s4', 'senior', 'campus', '우편취급국은 어디에 있을까?', ['학생회관 4층', '학생회관 1층', '율곡기념도서관 지하', '단우홀 1층'], 0, '우편취급국은 학생회관 4층에 있어요.', SRC.facility),
  pick('seed-s5', 'senior', 'etc', '단국대가 1947년 처음 개교한 곳은?', ['서울 종로구 낙원동', '서울 용산구 한남동', '천안시 안서동', '용인시 죽전동'], 0, '단국대는 1947년 11월 3일 서울 종로구 낙원동에서 처음 문을 열었어요.', SRC.history),
  pick('seed-s6', 'senior', 'academic', '직전 학기 평점이 몇 점 이상이면 수강신청 학점을 3학점 더 받을까?', ['4.0', '3.5', '4.3', '3.0'], 0, '직전 학기 평균 평점 4.0 이상이면 19학점에 3학점을 더해 신청할 수 있어요.', SRC.course),
  pick('seed-s7', 'senior', 'transport', '천안캠퍼스의 도로명 주소는?', ['단대로 119', '단대로 152', '천호대로 119', '안서로 47'], 0, '주소는 충남 천안시 동남구 단대로 119예요.', SRC.way),
  pick('seed-s8', 'senior', 'academic', '일반 학과의 졸업 기준 취득학점은?', ['130학점 이상', '120학점 이상', '140학점 이상', '150학점 이상'], 0, '일반 학과는 130학점 이상이에요. 법과대학 · 해병대군사학과는 140학점, 건축학과는 165학점이에요.', SRC.graduate),
  pick('seed-s9', 'senior', 'transport', '두정역 등교 셔틀을 타는 곳의 공식 이름은?', ['셔틀버스 환승시설', '두정역 1번 출구', '두정역 버스정류장', '두정역 광장'], 0, '두정역 등교 셔틀은 「셔틀버스 환승시설」에서 타요.', SRC.shuttle),
  pick('seed-s10', 'senior', 'campus', '학생회관 3층에 없는 것은?', ['우편취급국', '학생식당 1947_commons', '대학진료소', '카페 1847'], 0, '우편취급국은 학생회관 4층이에요. 식당 · 진료소 · 카페 1847은 3층에 있어요.', SRC.facility),

  // ── 11/25 추가: 학사 · 제도 (규정집 원문) ──
  pick('seed-a8', 'newbie', 'academic', '단국대 성적 평점의 만점은?', ['4.5', '4.0', '4.3', '5.0'], 0, 'A+(95~100점)가 4.5점이에요. 평점 만점은 4.5예요.', RULE.hak(34)),
  pick('seed-a9', 'newbie', 'academic', '학점으로 인정되는 가장 낮은 등급은?', ['D', 'C', 'C+', 'D+'], 0, 'D등급 이상이면 학점을 취득하고, F는 학점으로 인정되지 않아요.', RULE.hak(35)),
  pick('seed-a10', 'newbie', 'academic', '출석해야 할 시간의 얼마를 넘게 결석하면 과락 처리될까?', ['3분의 1', '4분의 1', '5분의 1', '2분의 1'], 0, '출석해야 할 시간의 3분의 1을 넘겨 결석하면 시험 자격이 없어지고 과락 처리돼요. 「4분의 1」로 잘못 아는 경우가 많아요.', RULE.hak(33)),
  pick('seed-a11', 'newbie', 'academic', '학기 평점평균이 얼마 미만이면 학사경고를 받을까?', ['1.5', '1.0', '1.75', '2.0'], 0, '해당 학기 평점평균이 1.5 미만이면 학사경고 대상이에요.', RULE.hak(27)),
  pick('seed-a12', 'newbie', 'academic', '재학 중 학사경고를 몇 번 연속으로 받으면 제적될까?', ['연속 3회', '연속 2회', '누적 4회', '연속 5회'], 0, '재학 중 학사경고를 연속 3회 받으면 제적돼요.', RULE.hak(26)),
  ox('seed-a13', 'newbie', 'academic', '편입생은 입학한 첫 학기가 끝나기 전에도 일반휴학을 할 수 있다?', false, '신입생 · 편입생 · 재입학생은 입학 후 해당 연도 1개 학기가 끝날 때까지 일반휴학이 승인되지 않아요. (입대 · 질병휴학은 이 제한과 별개)', RULE.sehak(13)),
  pick('seed-a14', 'newbie', 'academic', '계절학기에 재학생이 신청할 수 있는 최대 학점은?', ['6학점', '3학점', '9학점', '12학점'], 0, '계절학기는 재학생 · 휴학생 6학점 이내예요. (외국인 유학생은 9학점)', RULE.season(5)),
  pick('seed-a15', 'newbie', 'academic', '등록금은 최대 몇 차까지 나눠 낼 수 있을까?', ['4차', '2차', '6차', '나눠 낼 수 없다'], 0, '등록금은 2~4차로 나눠 낼 수 있어요. 재입학생 · 휴학생 · 수업연한초과자는 분납 대상이 아니에요.', RULE.tuition),
  ox('seed-a16', 'newbie', 'academic', '직전 학기에 학사경고를 받아도 장학금은 받을 수 있다?', false, '직전 학기에 학사경고를 받았으면 장학금이 지급되지 않아요.', RULE.scholar(7)),
  pick('seed-a17', 'newbie', 'academic', '천안캠퍼스에 있는 심리상담 기관의 공식 이름은?', ['대학생활상담센터', '학생상담센터', '심리건강센터', '마음건강센터'], 0, '대학생활상담센터가 죽전 · 천안캠퍼스에 각각 있어요.', RULE.org(34)),

  pick('seed-s11', 'senior', 'academic', '성적은 원칙적으로 시험과 출석을 어떤 비율로 평가할까?', ['시험 80 : 출석 20', '시험 70 : 출석 30', '시험 90 : 출석 10', '시험 60 : 출석 40'], 0, '원칙은 시험성적 100분의 80, 출석성적 100분의 20이에요.', RULE.hak(33)),
  ox('seed-s12', 'senior', 'academic', '재학 중 수강신청을 하지 않아도 학사경고를 받을 수 있다?', true, '평점 1.5 미만뿐 아니라, 재학 중 수강신청을 하지 않은 학생과 2과목 이상 · 6학점 이상 과락인 학생도 학사경고 대상이에요.', RULE.hak(27)),
  pick('seed-s13', 'senior', 'academic', '재학 중 일반휴학의 총 한도는?', ['3년 · 4회', '2년 · 3회', '4년 · 6회', '제한 없음'], 0, '일반휴학은 1회에 2개 학기까지, 재학 중 총 3년 · 4회를 넘을 수 없어요.', RULE.sehak(15)),
  pick('seed-s14', 'senior', 'academic', '휴학 제한 기간 · 횟수에 포함되는 휴학은?', ['일반휴학', '입대휴학', '창업휴학', '육아휴학'], 0, '입대 · 질병 · 육아 · 창업휴학은 휴학 제한 기간과 횟수에 포함되지 않아요.', RULE.register),
  pick('seed-s15', 'senior', 'academic', '군 제대 후 그 학기에 바로 복학하려면 언제까지 제대해야 할까?', ['개강 후 1개월 이내', '개강 후 2주 이내', '개강 후 2개월 이내', '학기 중 언제든'], 0, '개강 후 1개월 이내 제대자에 한해 전역예정증명서를 내면 복학을 허가해요.', RULE.register),
  ox('seed-s16', 'senior', 'academic', '계절학기 성적도 학사경고와 장학생 선발 기준에 반영된다?', false, '계절학기 성적은 총 평점과 졸업학점에만 반영되고, 학사경고 · 장학생 선발에는 반영되지 않아요.', RULE.season(8)),
  pick('seed-s18', 'senior', 'academic', '재수강한 과목에서 받을 수 있는 최고 성적은?', ['A', 'A+', 'B+', '두 성적의 평균'], 0, '재수강 과목은 A 이하로 평가하고, 예전 성적은 삭제돼요.', RULE.sehak(7)),
  pick('seed-s19', 'senior', 'academic', '부전공을 인정받으려면 해당 전공과목을 몇 학점 이상 따야 할까?', ['21학점', '15학점', '18학점', '36학점'], 0, '부전공은 해당 전공과목 21학점 이상이 필요해요. 복수전공은 최대 2개까지 이수할 수 있어요.', RULE.hak(46)),
  // ── 11/25 추가: 캠퍼스 생활 · 상징 ──
  pick('seed-e3', 'newbie', 'etc', '단국대의 교시(校是)는?', ['진리와 봉사', '자유와 정의', '근면과 협동', '창조와 도전'], 0, '창학 정신을 구현하는 교육 지표로 「진리」와 「봉사」를 들었어요.', LIFE.idea),
  pick('seed-e4', 'newbie', 'etc', '단국대의 창학 정신은?', ['구국 · 자주 · 자립', '자유 · 평등 · 박애', '진리 · 자유 · 봉사', '성실 · 근면 · 협동'], 0, '홍익인간 정신을 바탕으로 한 구국 · 자주 · 자립이 창학 정신이에요.', LIFE.idea),
  pick('seed-e5', 'newbie', 'etc', '2026년 11월 천안캠퍼스에 새로 생긴 정문은 어떤 모양일까?', ['책갈피가 꽂힌 펼친 책', '곰 발자국', '횃불', '태극 문양'], 0, '새 정문은 펼친 책 가운데 책갈피가 꽂힌 모습이고, 옆에 25m 높이의 상징탑도 세워졌어요.', LIFE.gate),
  pick('seed-c3', 'newbie', 'campus', '천안캠퍼스에 있는 단과대학은?', ['바이오융합대학', '공과대학', '사범대학', '법과대학'], 0, '바이오융합대학은 천안캠퍼스 단과대학이에요. 공과대학 · 사범대학 · 법과대학은 천안캠퍼스 목록에 없어요.', LIFE.cheonan),
  pick('seed-c4', 'newbie', 'campus', '천안캠퍼스의 전공 탐색 칼리지 이름은?', ['율곡혁신칼리지', '퇴계혁신칼리지', '프리무스국제대학', '천안혁신칼리지'], 0, '천안캠퍼스는 율곡혁신칼리지, 죽전캠퍼스는 퇴계혁신칼리지예요. 도서관 이름처럼 천안은 율곡, 죽전은 퇴계!', LIFE.cheonan),
  pick('seed-c5', 'newbie', 'campus', '천안캠퍼스 생활관(기숙사)이 아닌 곳은?', ['웅비홀', '학사재', '단우홀', '봉사관'], 0, '천안캠퍼스 생활관은 학사재 · 단우홀 · 봉사관 세 곳이에요.', LIFE.cheonan),
  pick('seed-f2', 'newbie', 'food', '인문과학관 1층에 있는 카페는?', ['ing 카페', '컴포즈커피', '카페 1847', '1947_commons'], 0, 'ing 카페는 인문과학관 1층이에요. 컴포즈커피는 단우홀 1층, 카페 1847은 학생회관 3층이에요. (입점 가게는 바뀔 수 있어요)', LIFE.facility),
  pick('seed-f3', 'newbie', 'food', '컴포즈커피는 어디에 있을까?', ['단우홀 1층', '학생회관 3층', '인문과학관 1층', '율곡기념도서관 지하'], 0, '컴포즈커피는 단우홀 1층에 있어요. (입점 가게는 바뀔 수 있어요)', LIFE.facility),
  pick('seed-f4', 'newbie', 'food', '교내 우리은행은 어디에 있을까?', ['학생회관 3층', '학생회관 4층', '율곡기념도서관 지하', '단우홀 1층'], 0, '우리은행은 학생회관 3층에 있어요. 서점 · 문구점도 학생회관 3층(극장동)이에요.', LIFE.facility),

  pick('seed-s20', 'senior', 'campus', '생활관(기숙사) 행정 사무실은 어디에 있을까?', ['봉사관 102호', '단우홀 101호', '학사재 102호', '학생회관 206호'], 0, '생활관 행정실은 봉사관 102호예요.', LIFE.cheonan),
  pick('seed-s21', 'senior', 'campus', '학생팀과 장애학생지원센터가 있는 곳은?', ['학생회관 206호', '학생회관 205호', '학생회관 403호', '봉사관 102호'], 0, '학생팀 · 장애학생지원센터는 학생회관 206호예요. 205호는 장학팀, 403호는 취창업진로2팀이에요.', LIFE.cheonan),
  pick('seed-s22', 'senior', 'campus', '장학금 문의는 어디로 가야 할까?', ['학생회관 205호 장학팀', '학생회관 206호 학생팀', '봉사관 102호', '학생회관 403호'], 0, '장학팀은 학생회관 205호에 있어요.', LIFE.cheonan),
  pick('seed-s23', 'senior', 'campus', '대학생활상담센터는 어디에 있을까?', ['학생회관 102-01호', '학생회관 102-08호', '학생회관 201-02호', '학생회관 113-01호'], 0, '대학생활상담센터는 학생회관 102-01호예요. (102-08호는 양성평등상담소)', LIFE.cheonan),
  pick('seed-s24', 'senior', 'food', '학생회관에서 여학생 전용 휴게실이 있는 층은?', ['2층', '1층', '3층', '4층'], 0, '학생회관 2층 휴게실은 여학생 전용이고, 4층 휴게실은 누구나 쓸 수 있어요.', LIFE.facility),
  pick('seed-s25', 'senior', 'campus', '학생회관 극장동 우리은행 앞, 충전 좌석과 소파가 있는 휴게 공간의 이름은?', ['1947_lounge', '1947_commons', '카페 1847', '단국 라운지'], 0, '2026년 3월 말에 문을 연 휴게 공간 「1947_lounge」예요. 1947_commons는 학생식당 이름이에요.', LIFE.lounge),
  pick('seed-s26', 'senior', 'etc', '단국대 설립자는?', ['범정 장형 선생 · 혜당 조희재 여사', '율곡 이이 · 신사임당', '퇴계 이황 · 남명 조식', '도산 안창호 · 백범 김구'], 0, '설립자는 범정 장형 선생과 혜당 조희재 여사예요.', LIFE.founder),
  pick('seed-s27', 'senior', 'etc', '단국대의 인재상은?', ['능동 · 혁신 · 헌신의 D3 인재', '창의 · 융합 · 소통의 C3 인재', '도전 · 창조 · 글로벌의 G3 인재', '진리 · 봉사 · 협력의 S3 인재'], 0, '인재상은 「능동 · 혁신 · 헌신의 D3 인재」예요.', LIFE.talent),
  pick('seed-s28', 'senior', 'etc', '단국대 심벌마크가 형상화한 것은?', ['DKU를 중심으로 회전하는 빛', '검은 곰 얼굴', '펼친 책', '단군 초상'], 0, '심벌마크는 영문 이니셜 DKU를 중심으로 역동적으로 회전하는 빛을 상징화했어요.', LIFE.ui),
  pick('seed-s29', 'senior', 'etc', '천안캠퍼스 설립 50주년이 되는 해는?', ['2028년', '2027년', '2030년', '2025년'], 0, '천안캠퍼스는 1978년에 세워져 2028년이 50주년이에요. (2027년은 단국대 개교 80주년)', LIFE.gate),
  // ── 11/25 추가: GPT 조사 (중복 5개 · 확인 안 된 편입 학점 2개 제외) ──
  gpt(pick('seed-g1', 'newbie', 'food', '인문과학관의 교내 편의점은 몇 층에 있을까?', ['지하층', '2층', '3층', '4층'], 0, '인문과학관 편의점은 지하에 있어요. (입점 가게는 바뀔 수 있어요)', GPT.facility)),
  gpt(ox('seed-g2', 'newbie', 'transport', '셔틀버스는 만차여도 예정된 출발 시각까지 기다렸다가 출발한다?', false, '만차면 정해진 시간보다 먼저 출발할 수 있어요. 승차장에 여유 있게 가세요!', GPT.shuttle)),
  gpt(ox('seed-g3', 'newbie', 'campus', '모바일 학생증은 안드로이드와 iOS 스마트폰 모두에서 쓸 수 있다?', true, '안드로이드 · iOS 스마트폰 모두 모바일 학생증을 쓸 수 있어요.', GPT.card)),
  gpt(pick('seed-g4', 'newbie', 'campus', '천안캠퍼스 장애학생지원센터는 어느 건물에 있을까?', ['학생회관', '공학관', '인문과학관', '체육관'], 0, '장애학생지원센터는 학생회관 206-1호에 있어요.', GPT.support)),
  gpt(pick('seed-g5', 'newbie', 'food', '천원의 아침밥 사업의 목적은?', ['건강한 식습관 형성과 국산 쌀 소비 촉진', '외국산 쌀 소비 확대', '학생 저녁 식사 확대', '대학원 연구비 지원'], 0, '청년층의 건강한 식습관 형성과 국산 쌀 소비 촉진을 위한 사업이에요. 천안캠퍼스에서도 운영하고 있어요.', GPT.breakfast)),
  gpt(pick('seed-g6', 'senior', 'food', '미술용품을 파는 교내 화방은 어디에 있을까?', ['예술관 A동 지하', '공학관 2층', '사회과학관 3층', '약학관 2층'], 0, '화방은 예술관 A동 지하에 있어요. (입점 가게는 바뀔 수 있어요)', GPT.facility)),
  gpt(pick('seed-g7', 'senior', 'food', '율곡기념도서관 안 복사점은 어디에 있을까?', ['지하와 3층', '1층과 2층', '2층과 4층', '3층과 4층'], 0, '도서관 복사시설은 지하와 3층에 있어요.', GPT.facility)),
  gpt(pick('seed-g8', 'senior', 'campus', '율곡기념도서관의 자동심장충격기(AED)는 어디에 있을까?', ['1층 경비실 앞', '지하 복사점 앞', '2층 열람실 앞', '4층 계단 앞'], 0, '율곡기념도서관 AED는 1층 경비실 앞에 있어요. 위치를 알아 두면 위급할 때 도움이 돼요.', GPT.facility)),
  gpt(pick('seed-g9', 'senior', 'campus', '율곡기념도서관에서 하는 서비스는?', ['상호대차 및 원문복사', '예비군 훈련 신청', '등록금 수납', '생활관 입사 심사'], 0, '도서관은 다른 도서관 자료를 빌려 보는 상호대차와 원문복사 서비스를 해요.', GPT.cheonan)),
  gpt(pick('seed-g10', 'senior', 'etc', '단국대 교기에 담긴 사상은 무엇과 일치할까?', ['태극기', '무궁화', '한반도 지도', '애국가'], 0, '교기는 국기인 태극기의 사상과 일치해요.', GPT.symbol)),
  gpt(pick('seed-g11', 'senior', 'etc', '천안캠퍼스 개교 당시 「산업학관」이라 불린 건물의 지금 이름은?', ['자연과학1관', '공학관', '사회과학관', '인문과학관'], 0, '옛 산업학관이 지금의 자연과학1관이에요.', GPT.museum)),
  gpt(pick('seed-g12', 'senior', 'etc', '2014년 죽전 · 천안캠퍼스가 바뀐 운영 체제는?', ['단일교지(원 캠퍼스) 체제', '독립대학 체제', '전문대학 체제', '사이버대학 체제'], 0, '2014년 두 캠퍼스가 단일교지(원 캠퍼스) 체제로 바뀌었어요.', GPT.report)),
  gpt(ox('seed-g13', 'senior', 'academic', '편입생이 전 대학에서 인정받은 졸업인증 실적이 단국대 기준 이상이면 인정받을 수 있다?', true, '전적대학에서 인정받은 실적 · 점수가 단국대 기준 이상이면 인정할 수 있어요.', GPT.rule56)),
  // ── 11/25 추가: 색다른 유형 (상황형 · 착각 깨기 · 순서/숫자). 출처 문장 원문 대조 완료 ──
  { ...base, id: "seed-n1", level: "newbie", category: "academic", type: "choice", question: "발목을 다쳐 1주일 동안 수업에 못 가게 됐다. 가장 알맞은 방법은?", choices: ["유고결석 출석인정을 신청한다", "질병휴학을 신청한다", "학점포기를 신청한다", "아무 절차 없이 그냥 결석해도 된다"], answer: 0, explanation: "질병·상해 치료는 2주 이내까지 유고결석 출석인정을 받을 수 있어요(입원확인서나 진단서 + 진료비 영수증). 질병휴학은 4주 이상 장기치료일 때예요.", source: "학칙 시행세칙 제12조의2 · 제13조 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n2", level: "newbie", category: "academic", type: "choice", question: "예비군 훈련 때문에 수업을 빠졌다. 출석인정은 언제까지 신청해야 할까?", choices: ["사유 발생 전이나 훈련 끝난 날부터 14일 이내", "학기 말까지 아무 때나", "훈련 다음 날까지만", "성적이 나온 뒤 이의신청 기간에"], answer: 0, explanation: "예비군 훈련은 훈련기간 출석인정 사유예요. 다만 사유 발생 전이나 끝난 날부터 14일 안에 신청해야 하고, 지나면 효력이 사라져요.", source: "학칙 시행세칙 제12조의2 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n3", level: "newbie", category: "academic", type: "choice", question: "한 과목에서 결석은 없는데 지각만 3번 했다. 출결은 어떻게 될까?", choices: ["결석 1회로 환산된다", "지각은 출결에 반영되지 않는다", "결석 3회로 처리된다", "그 과목은 바로 F 처리된다"], answer: 0, explanation: "지각·조퇴가 각각 3회면 결석 1회로 환산하는 게 원칙이에요. 수업 중 무단 퇴실은 결석으로 봐요.", source: "학칙 시행세칙 제12조의6 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n4", level: "newbie", category: "academic", type: "choice", question: "기말고사 중 부정행위가 적발됐다. 그 과목 성적은 어떻게 될까?", choices: ["F로 처리된다", "재시험 기회를 준다", "중간고사 성적만으로 평가한다", "한 등급만 깎인다"], answer: 0, explanation: "시험부정행위는 응시 무효가 되고 해당 과목은 F로 처리돼요. 경중에 따라 징계를 받을 수도 있어요.", source: "학칙 시행세칙 제12조의3 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n5", level: "senior", category: "academic", type: "choice", question: "등록금을 낸 뒤 개강 20일째에 일반휴학을 했다. 이미 낸 등록금은?", choices: ["복학하는 학기 등록금으로 대체된다", "돌려받지 못하고 사라진다", "이번 학기 성적까지 인정받는다", "다음 날 전액 현금으로 돌려받는다"], answer: 0, explanation: "학기 개시일부터 30일까지 일반휴학하면 낸 등록금은 복학 학기 등록금으로 대체돼요. 단, 학기 중 일반휴학이라 그 학기 성적은 인정되지 않아요. (51일째부터는 휴학원서 제출 불가)", source: "학칙 시행세칙 제18조 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n6", level: "senior", category: "academic", type: "choice", question: "등록을 마친 학생이 개강 8주째에 입영통지를 받아 입대휴학을 했다. 그 학기 등록금은?", choices: ["복학하는 학기 등록금으로 대체된다", "그 학기를 다 이수한 것으로 인정된다", "전액 사라진다", "입대휴학은 학기 중엔 할 수 없다"], answer: 0, explanation: "입대·질병·육아휴학은 학기 개시일부터 10주 이전이면 복학 학기 등록금으로 대체해요. 10주가 지난 뒤 휴학하면 그 학기를 이수한 것으로 인정해요.", source: "학칙 시행세칙 제18조 제2항 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n7", level: "senior", category: "academic", type: "ox", question: "군 복무로 휴학 중이면 학점을 전혀 딸 수 없다?", choices: ["O", "X"], answer: 1, explanation: "입영·복무로 휴학 중이어도 온라인 강좌에 한해 학기당 6학점 이내로 수강신청할 수 있어요. 등록금은 계절강좌 기준으로 내요.", source: "학칙 시행세칙 제4조 제6항 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n8", level: "newbie", category: "academic", type: "ox", question: "같은 과목은 재수강을 딱 한 번만 할 수 있다?", choices: ["O", "X"], answer: 1, explanation: "재수강 횟수는 제한이 없어요. 대신 C+ 이하 과목만, 한 학기 6학점까지예요.", source: "학칙 시행세칙 제7조 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n9", level: "newbie", category: "academic", type: "ox", question: "휴학 기간이 끝났는데 복학 신청을 안 하면 휴학이 자동으로 연장된다?", choices: ["O", "X"], answer: 1, explanation: "자동 연장은 없어요. 정해진 기간에 복학하지 않으면 제적돼요. 휴학을 더 하려면 만료 전에 휴학원서를 다시 내야 해요.", source: "학칙 시행세칙 제19조 · 제16조 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n10", level: "senior", category: "academic", type: "ox", question: "마지막 학기에도 최소 12학점은 수강신청해야 한다?", choices: ["O", "X"], answer: 1, explanation: "매 학기 최저 12학점이 원칙이지만, 최종 학기는 6학점 이상이면 돼요.", source: "학칙 시행세칙 제4조 제2항 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n11", level: "newbie", category: "academic", type: "ox", question: "편입생도 같은 캠퍼스 안의 다른 학과로는 전과(전부(과))할 수 있다?", choices: ["O", "X"], answer: 1, explanation: "편입학자는 캠퍼스 간뿐 아니라 전부(과) 자체가 허용되지 않아요. 체육특기자·징계받은 학생도 마찬가지예요.", source: "학칙 시행세칙 제23조 제4항 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n12", level: "senior", category: "academic", type: "ox", question: "졸업인증을 못 채워 수료 처리되면, 나중에 기준을 채워도 졸업할 수 없다?", choices: ["O", "X"], answer: 1, explanation: "수료 후에라도 졸업인증 기준을 채워 신청서를 내면, 낸 학기에 졸업을 인정받아요.", source: "학칙 시행세칙 제58조 (rule.dankook.ac.kr/service/law/lawFullScreenContent.do, 2026-11-25 확인)" },
  { ...base, id: "seed-n13", level: "newbie", category: "etc", type: "ox", question: "천안캠퍼스는 죽전캠퍼스보다 나중에 생겼다?", choices: ["O", "X"], answer: 1, explanation: "천안캠퍼스는 1978년 3월 개교식을 했고, 죽전캠퍼스는 서울(한남동)에서 옮겨 와 2007년 8월에 준공했어요. 죽전에 캠퍼스가 들어선 건 천안보다 약 30년 뒤예요.", source: "단국대 홈페이지 > 약사 (dankook.ac.kr/web/kor/-34, 2026-11-25 확인)" },
  { ...base, id: "seed-n14", level: "newbie", category: "etc", type: "choice", question: "다음 중 가장 먼저 있었던 일은?", choices: ["한남동 캠퍼스 입교", "종합대학 승격", "천안캠퍼스 개교식", "죽전캠퍼스 준공식"], answer: 0, explanation: "한남동 입교 1957년 → 종합대학 승격 1967년 → 천안캠퍼스 개교식 1978년 → 죽전캠퍼스 준공식 2007년 순서예요.", source: "단국대 홈페이지 > 약사 (dankook.ac.kr/web/kor/-34, 2026-11-25 확인)" },
  { ...base, id: "seed-n15", level: "senior", category: "etc", type: "choice", question: "다음 중 가장 나중에 있었던 일은?", choices: ["단국대학교 병원 개원", "치과대학 교사 완공 및 부속병원 개관", "의예과 신설 인가", "천안캠퍼스 개교식"], answer: 0, explanation: "천안캠퍼스 개교식 1978년 3월 → 치과대학 교사 완공·부속병원 개관 1984년 9월 → 의예과 인가 1987년 10월 → 단국대학교 병원 개원 1994년 4월 29일 순서예요.", source: "단국대 홈페이지 > 약사 (dankook.ac.kr/web/kor/-34, 2026-11-25 확인)" },
  { ...base, id: "seed-n16", level: "senior", category: "etc", type: "choice", question: "다음 중 숫자가 가장 큰 것은?", choices: ["1947년 개교 때 모집한 학생 수", "1994년 단국대병원 개원 때 병상 수", "단국대병원 기숙사 수용 인원", "단국대병원 개원 때 입원실 수"], answer: 0, explanation: "개교 때 모집 학생 960명 > 병상 800개 > 병원 기숙사 417명 > 입원실 244실이에요.", source: "단국대 홈페이지 > 약사 (dankook.ac.kr/web/kor/-34, 2026-11-25 확인)" },
  { ...base, id: "seed-n17", level: "senior", category: "etc", type: "choice", question: "옛 단국인 마라톤대회 때 천안캠퍼스 코스(대운동장~천안삼거리 왕복)의 거리는?", choices: ["12.6km", "10.5km", "5km", "42.195km"], answer: 0, explanation: "천안캠퍼스는 대운동장에서 천안삼거리를 왕복하는 12.6km였어요. 10.5km는 한남캠퍼스(노천극장~한강대교 왕복) 코스예요.", source: "단국역사관 > 이달의 기록물 2026년 11월 「단국인 마라톤대회」 (cms.dankook.ac.kr/web/historymuseum/-9, 2026-11-25 확인)" },
  // ── 11/25 추가: 최신 학교 소식 · 캠퍼스 주변 생활 (공식 웹진 · 홈페이지 · 단국대병원 · 천안시. 확인 필요한 1개 제외) ──
  { ...base, id: "seed-m1", level: "newbie", category: "campus", type: "choice", question: "2026년 천안캠퍼스에 새로 문을 연, 단국역사문고 · 굿즈 전시장 · 카페를 갖춘 복합 문화 공간의 이름은?", choices: ["베어토피아_1978", "곰마루_1947", "단국스퀘어_1978", "율곡라운지_2026"], answer: 0, explanation: "천안캠퍼스에 복합 문화 공간 「베어토피아_1978」이 새로 문을 열었어요. 단국역사문고에는 책 약 1천 권이 있어서 누구나 자유롭게 읽을 수 있어요.", source: "DKU WEBZINE 「“단국의 미래, 쉼과 영감으로 채우다”… 캠퍼스 곳곳 ‘학생 중심’ 공간 탈바꿈」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1036, 2026-04-29, 2026-11-25 확인)" },
  { ...base, id: "seed-m2", level: "senior", category: "etc", type: "choice", question: "천안캠퍼스 복합 문화 공간 「베어토피아_1978」에서 「1978」이 뜻하는 것은?", choices: ["천안캠퍼스 설립 연도", "단국대 개교 연도", "공간이 들어선 건물의 준공 연도", "초대 총장 취임 연도"], answer: 0, explanation: "「1978」은 천안캠퍼스가 세워진 해를 뜻해요. 「베어토피아」는 상징동물 검은 곰(Bear)과 그리스어로 터전을 뜻하는 「토피아(topia)」를 합친 말이에요.", source: "DKU WEBZINE 「“단국의 미래, 쉼과 영감으로 채우다”… 캠퍼스 곳곳 ‘학생 중심’ 공간 탈바꿈」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1036, 2026-04-29, 2026-11-25 확인)" },
  { ...base, id: "seed-m3", level: "newbie", category: "etc", type: "choice", question: "2026년 5월 6~7일 천안캠퍼스에서 열린 대동제(축제)의 이름은?", choices: ["청풍명월", "안서체전", "한마음 축구 교류전", "홈커밍 캠퍼스 걷기"], answer: 0, explanation: "2026년 천안캠퍼스 대동제 이름은 「청풍명월(淸風明月)」이에요. 안서체전 · 한마음 축구 교류전 · 홈커밍 캠퍼스 걷기는 따로 열린 다른 행사예요.", source: "DKU WEBZINE 「청춘의 열기 가득, 천안캠퍼스 ‘2026 청풍명월’ 축제 성료」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1055, 2026-05-11, 2026-11-25 확인)" },
  { ...base, id: "seed-m4", level: "newbie", category: "etc", type: "choice", question: "2026년 10월 천안캠퍼스 「안서체전」의 마라톤(2.5km · 5km)은 어디 일대를 달렸을까?", choices: ["천호지", "태조산공원", "천안삼거리공원", "독립기념관"], answer: 0, explanation: "안서체전 마라톤은 학교 옆 천호지 일대를 달렸어요. 무대 공연과 맥주 페스티벌도 함께 열렸어요.", source: "DKU WEBZINE 「단국대 천안캠퍼스 ‘안서체전: 맥시멈(MAX:脈)’ 나눔과 화합의 레이스」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1380, 2026-10-02, 2026-11-25 확인)" },
  { ...base, id: "seed-m5", level: "senior", category: "etc", type: "choice", question: "2026 안서체전의 마라톤 참가비 · 맥주 페스티벌 입장료 등 수익금은 어디에 기부될까?", choices: ["한국해비타트 독립유공자 후손 주거환경 개선 사업", "천원의 아침밥 사업", "교내 성적장학금", "천호지 수변 정비 사업"], answer: 0, explanation: "수익금은 한국해비타트의 「독립유공자 후손 주거환경 개선 사업」에 기부돼요. 독립운동가가 세운 학교라는 창학정신을 살린 나눔이에요.", source: "DKU WEBZINE 「단국대 천안캠퍼스 ‘안서체전: 맥시멈(MAX:脈)’ 나눔과 화합의 레이스」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1380, 2026-10-02, 2026-11-25 확인)" },
  { ...base, id: "seed-m6", level: "newbie", category: "etc", type: "ox", question: "2026년 10월 「한마음 축구 교류전」에서 천안캠퍼스가 죽전캠퍼스를 이겼다?", choices: ["O", "X"], answer: 0, explanation: "천안캠퍼스 대운동장에서 열린 경기에서 천안캠퍼스가 3대 2로 이겼어요. 천안은 동아리 축구연구회가, 죽전은 사범대학이 대표로 나왔어요.", source: "DKU WEBZINE 「단국대 ‘2026 한마음 축구 교류전’ 성료, 천안캠퍼스 3:2 승」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1413, 2026-10-15, 2026-11-25 확인)" },
  { ...base, id: "seed-m7", level: "senior", category: "campus", type: "choice", question: "2026년 발표된 교육시설 안전인증평가에서 천안캠퍼스 18개 건물이 받은 등급은?", choices: ["18개 건물 모두 최우수", "18개 건물 모두 우수", "일부 건물만 최우수", "18개 건물 모두 보통"], answer: 0, explanation: "죽전 22개 · 천안 18개, 모두 40개 건물이 전부 「최우수」를 받았어요. 최우수 건물은 법에 따라 앞으로 10년간 인증 평가가 면제돼요.", source: "DKU WEBZINE 「단국대, 교육시설 안전인증평가 전 건물 ‘최우수’ 등급 획득」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1207, 2026-07-15, 2026-11-25 확인)" },
  { ...base, id: "seed-m8", level: "senior", category: "campus", type: "choice", question: "천안캠퍼스 체육관이 2026년 전면 개보수에 들어간 이유는?", choices: ["2027 충청권 하계세계대학경기대회 준비", "천안캠퍼스 50주년 기념관 신축", "생활관 증축 공사", "지하 주차장 확장"], answer: 0, explanation: "「2027 충청권 하계세계대학경기대회」 준비를 위해 전면 개보수에 들어갔어요. 그래서 2026년 농구부 홈경기는 죽전캠퍼스 체육관에서 열렸어요.", source: "DKU WEBZINE 「단국대 죽전캠퍼스에서 열린 첫 대학농구 홈경기, 명지대 대파」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1329, 2026-09-16, 2026-11-25 확인)" },
  { ...base, id: "seed-m9", level: "senior", category: "campus", type: "choice", question: "2008년 문을 열어, 개관 20주년(2028년)에 맞춰 3개년 단계적 리모델링을 하고 있는 천안캠퍼스 생활관은?", choices: ["단우홀", "웅비홀", "집현재", "어울림키친"], answer: 0, explanation: "천안캠퍼스 단우홀이에요. 2008년에 문을 열어 노후화로 단계적 리모델링을 하고 있어요. (웅비홀은 같은 해 문을 연 죽전캠퍼스 생활관)", source: "DKU WEBZINE 「단국대, 생활관 시설 새 단장… 학생 안전·주거복지 대폭 강화」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1411, 2026-10-14, 2026-11-25 확인)" },
  { ...base, id: "seed-m10", level: "newbie", category: "campus", type: "choice", question: "2026년 11월부터 「Npay 페이스사인」으로 학생증 없이 얼굴 인식만으로 들어갈 수 있게 된 곳은?", choices: ["양 캠퍼스 도서관", "생활관(기숙사)", "학생식당", "체육관"], answer: 0, explanation: "Npay 앱에 얼굴을 등록하고 학번을 넣으면 양 캠퍼스 도서관에 얼굴만으로 들어갈 수 있어요. 생활관 출입과 카페 · 학생식당 결제는 2027년에 넓힐 계획이에요.", source: "DKU WEBZINE 「단국대, 국내 대학 최초 ‘Npay 페이스사인’ 도입」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1503, 2026-11-24, 2026-11-25 확인)" },
  { ...base, id: "seed-m11", level: "senior", category: "etc", type: "ox", question: "천안캠퍼스는 1978년 「국내 최초 제2캠퍼스」로 출발했다?", choices: ["O", "X"], answer: 0, explanation: "총장이 2026 홈커밍 캠퍼스 걷기 환영사에서 천안캠퍼스가 1978년 국내 최초 제2캠퍼스로 출발했다고 소개했어요.", source: "DKU WEBZINE 「“함께 걷고, 함께 여는 단국 미래”「2026 홈커밍 캠퍼스 걷기」성공적 개최」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1019, 2026-04-27, 2026-11-25 확인)" },
  { ...base, id: "seed-m12", level: "newbie", category: "etc", type: "choice", question: "2026 홈커밍 캠퍼스 걷기의 「천안캠퍼스 8경」 코스에 들어가지 않은 곳은?", choices: ["태조산공원", "베어토피아_1978", "율곡기념도서관", "단대 호수(천호지)"], answer: 0, explanation: "코스는 학생회관에서 출발해 베어토피아_1978 · 체육관 · 생활관 · 율곡기념도서관 · 의료원 · 대운동장 · 단대 호수(천호지)를 돌았어요. 태조산공원은 코스에 없어요.", source: "DKU WEBZINE 「“함께 걷고, 함께 여는 단국 미래”「2026 홈커밍 캠퍼스 걷기」성공적 개최」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1019, 2026-04-27, 2026-11-25 확인)" },
  { ...base, id: "seed-m13", level: "newbie", category: "etc", type: "choice", question: "천안캠퍼스 옆 호수 천호지를 단국대 공식 웹진은 뭐라고 부를까?", choices: ["단대 호수", "율곡 호수", "곰 호수", "안서 저수지"], answer: 0, explanation: "단국대 웹진은 천호지를 「단대 호수(천호지)」라고 적어요. 홈커밍 행사의 「천안캠퍼스 8경」 코스에도 들어갔어요.", source: "DKU WEBZINE 「“함께 걷고, 함께 여는 단국 미래”「2026 홈커밍 캠퍼스 걷기」성공적 개최」 (webzine.dankook.ac.kr/news/articleView.html?idxno=1019, 2026-04-27, 2026-11-25 확인)" },
  { ...base, id: "seed-m14", level: "senior", category: "etc", type: "choice", question: "천안시 관광 안내에 따르면 천호지는 원래 무엇을 위해 만든 저수지일까?", choices: ["천안 지역 농업용수 공급", "천안시 수돗물 취수", "대학 조경용 연못", "공업단지 냉각수 공급"], answer: 0, explanation: "천호지는 1957년 한국농어촌공사가 천안 지역 농업용수를 대려고 만든 저수지예요. 지금은 마라톤 코스 · 분수 · 현수교가 있는 시민 호수공원이에요.", source: "천안시 문화관광 > 추천여행 > 사진여행 > 천호지 야경 (cheonan.go.kr/prog/tuTrsm/tour/sub02_04_05/view.do?mngNo=22, 날짜 표기 없음, 2026-11-25 확인)" },
  { ...base, id: "seed-m15", level: "newbie", category: "etc", type: "choice", question: "천안시가 꼽은 「천안 12경」에서 천호지 야경은 몇 번째 경치일까?", choices: ["제12경", "제1경", "제5경", "12경에 없다"], answer: 0, explanation: "천호지 야경은 천안 12경 중 제12경이에요. 밤에도 산책하는 사람이 많아요.", source: "천안시 문화관광 > 추천여행 > 사진여행 > 천호지 야경 (cheonan.go.kr/prog/tuTrsm/tour/sub02_04_05/view.do?mngNo=22, 날짜 표기 없음, 2026-11-25 확인)" },
  { ...base, id: "seed-m16", level: "newbie", category: "etc", type: "choice", question: "천안캠퍼스 근처 단국대학교병원이 문을 연 해는?", choices: ["1994년", "1978년", "1947년", "2008년"], answer: 0, explanation: "단국대학교병원은 1994년 4월 29일 문을 열었어요. 1978년은 천안캠퍼스, 1947년은 단국대가 처음 문을 연 해예요.", source: "단국대학교병원 > 병원소개 > 현황 (dkuh.co.kr/html_2016/01/01_03.php, 2026-11-25 확인)" },
  { ...base, id: "seed-m17", level: "senior", category: "etc", type: "choice", question: "단국대학교병원(천안)의 도로명 주소는?", choices: ["충남 천안시 동남구 망향로 201", "충남 천안시 동남구 단대로 119", "충남 천안시 서북구 번영로 156", "경기 용인시 수지구 죽전로 152"], answer: 0, explanation: "단국대학교병원 주소는 충남 천안시 동남구 망향로 201이에요. 천안캠퍼스(단대로 119)와 주소가 달라요.", source: "단국대학교병원 > 병원소개 > 찾아오시는 길 (dkuh.co.kr/html_2016/01/02.php, 2026-11-25 확인)" },
  { ...base, id: "seed-m18", level: "newbie", category: "transport", type: "choice", question: "학교 공식 「오시는 길」 기준, 경부고속도로 천안톨게이트에서 천안캠퍼스까지 예상 시간은?", choices: ["약 5분", "약 35분", "약 20분", "약 1시간"], answer: 0, explanation: "천안톨게이트에서 약 5분 거리예요. 35분은 서해안고속도로 서평택 송악톨게이트에서 오는 시간이에요.", source: "단국대 홈페이지 > 캠퍼스 안내 > 찾아오시는길 > 천안캠퍼스 (dankook.ac.kr/ko/-67, 최종수정 2026-10-30, 2026-11-25 확인)" },
]
