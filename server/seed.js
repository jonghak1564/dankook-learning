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
]
