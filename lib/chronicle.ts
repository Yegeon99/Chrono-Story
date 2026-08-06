// Chronicle: the full story as a chaptered scroll narrative (첫 화면).
// Every sentence is restated in our own words (copyright principle §6);
// proper nouns are auto-linked at render time against entities.json.
// entity_ids drive the per-chapter QA chips (unresolved foreshadowing / conflicts).

export type Chapter = {
  id: string;
  num: number;
  title: string;
  paragraphs: string[];
  entity_ids: string[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "creation",
    num: 1,
    title: "크로노스와 열두 세계",
    paragraphs: [
      "이 우주에는 열두 개의 행성이 있다. 전승은 그 모든 시간의 중심에 크로노스라는 신격을 둔다. 시간을 관장하는 존재이자, 훗날 크로노스 교단이 섬기게 될 이름이다. 각 행성에는 수호자가 하나씩 깃들었다. 사람들은 그들을 센티넬이라 불렀다.",
      "행성들 사이에는 아르케라는 근원 에너지가 흘렀다. 아르케가 풍부한 땅에서는 작물이 자라고 상처가 아물었으며, 어떤 문명은 그것을 마법으로, 어떤 문명은 룬과 장치를 통한 기술로 다루었다. 열두 세계는 그렇게 각자의 방식으로 번영했고, 센티넬들은 문명의 흥망에 깊이 개입하지 않은 채 오랜 세월 균형만을 지켰다.",
    ],
    entity_ids: [
      "ENT-CHRONOS",
      "ENT-TWELVE-WORLDS",
      "ENT-SENTINEL",
      "ENT-ARCHE",
      "ENT-CHRONOS-ORDER",
    ],
  },
  {
    id: "wrath",
    num: 2,
    title: "마젤란의 저주와 베텔기우스의 분노",
    paragraphs: [
      "마젤란의 센티넬 베텔기우스도 한때는 그 균형의 수호자였다. 크로노텍터를 지닌 반신으로서, 그는 자신의 행성과 운명을 함께하는 존재였다.",
      "그러나 크로노스의 축복은 열두 세계에 고르게 내리지 않았다. 세테라가 풍요를 누리는 동안, 마젤란에게 돌아온 것은 기근과 황폐의 저주였다. 자신의 행성이 말라 가는 것을 지켜본 베텔기우스는 그 불균형 앞에서 격렬한 분노에 사로잡혔고, 마침내 복수를 결심했다. 그 복수의 방법은 하나였다. 결코 열어서는 안 될 것을 여는 것이었다.",
    ],
    entity_ids: [
      "ENT-BETELGEUSE",
      "ENT-MAGELLAN",
      "ENT-CHRONOTECTOR",
      "ENT-SENTINEL",
      "ENT-CHRONOS",
      "ENT-SETERA",
    ],
  },
  {
    id: "unleashing",
    num: 3,
    title: "보이드의 해방",
    paragraphs: [
      "시간의 균열이 열렸다. 그 틈으로 보이드가 쏟아져 나왔다. 생명을 오염시키고 잠식하는 이계의 침략자들이었다. 베텔기우스가 복수를 위해 깨운 그것들은 순식간에 열두 행성으로 퍼져 나갔다.",
      "세계들이 하나씩 어둠에 삼켜졌다. 다른 행성들이 어떤 최후를 맞았는지, 그곳의 센티넬들은 어디로 갔는지, 기록은 대부분 침묵한다. 살아남은 자들의 이야기만이 남았다.",
    ],
    entity_ids: [
      "ENT-VOID",
      "ENT-TEMPORAL-RIFT",
      "ENT-TWELVE-WORLDS",
      "ENT-VOID-OUTBREAK",
    ],
  },
  {
    id: "invasion",
    num: 4,
    title: "세테라 침공과 브로큰",
    paragraphs: [
      "그리고 보이드는 세테라에 이르렀다. 보이드에 쓰러진 자들은 죽음으로 끝나지 않았다. 그들은 브로큰이라 불리는 흉측한 존재로 되살아나, 어제의 이웃에게 칼을 들었다. 스스로 보이드의 힘에 굴복한 자들과 의식을 유지한 채 보이드와의 합일을 추구하는 사제들은 데스리스라는 이름으로 보이드의 수족이 되었다.",
      "살아남은 사람들은 오염되지 않은 땅을 찾아 떠도는 정착민이 되었다. 한때 퍼스트 브레스 힐의 중심지였던 새벽 비탈 같은 마을들이 하나둘 버려졌고, 세테라는 멸망의 문턱까지 내몰렸다.",
    ],
    entity_ids: [
      "ENT-SETERA",
      "ENT-BROKEN",
      "ENT-DEATHLESS",
      "ENT-SETTLERS",
      "ENT-DAWN-SLOPE",
      "ENT-FIRST-BREATH-HILL",
    ],
  },
  {
    id: "frontier",
    num: 5,
    title: "프론티어의 결성",
    paragraphs: [
      "무너지는 세계에서 전설적인 전사 이오비스가 사람들을 모았다. 그렇게 결성된 프론티어는 보이드에 맞서는 세테라의 최전선이 되었고, 그 안에서도 가장 위험한 임무는 정예 부대 뱅가드의 몫이었다. 지휘관 에셀드레나, 그리고 카야, 발두르, 교단에서 파문당한 전력의 알렉시오스가 그 이름을 짊어졌다.",
      "전선 뒤에서는 또 다른 싸움이 있었다. 크로노스 교단은 교황 테오파네스 5세 아래 신앙으로 사람들을 붙들었고, 보이드 침공 전 유력 상인 길드를 이끌던 사비오는 프론티어의 재상이 되어 경제와 행정을 떠받쳤다. 신앙과 상업과 무력, 세 축의 동맹이 세테라의 마지막 방어선이었다.",
    ],
    entity_ids: [
      "ENT-FRONTIER",
      "ENT-IOBIS",
      "ENT-VANGUARD",
      "ENT-ETHELDRENA",
      "ENT-KAYA",
      "ENT-BALDUR",
      "ENT-ALEXIOS",
      "ENT-CHRONOS-ORDER",
      "ENT-THEOPHANES-V",
      "ENT-SABIO",
      "ENT-COMMERCE-GUILD",
    ],
  },
  {
    id: "ruins",
    num: 6,
    title: "시간의 유적과 크로노텍터",
    paragraphs: [
      "세테라 함락이 눈앞에 다가온 어느 날, 뱅가드는 고대의 유적인 시간의 유적으로 향했다. 그곳에는 센티넬에게 시간을 다루는 힘을 부여하는 유물, 크로노텍터가 잠들어 있었다.",
      "유적은 안전하지 않았다. 보이드 스파다가 그곳을 급습했고, 그 습격 속에서 지휘관 에셀드레나가 쓰러졌다. 혼돈의 한가운데서 크로노텍터를 손에 넣은 것은 이름 없는 한 사람, 주인공이었다. 그 순간 그는 세테라의 센티넬이 되었다.",
    ],
    entity_ids: [
      "ENT-RUINS-OF-TIME",
      "ENT-CHRONOTECTOR",
      "ENT-PROTAGONIST",
      "ENT-VOID-SPADA",
      "ENT-ETHELDRENA",
    ],
  },
  {
    id: "regression",
    num: 7,
    title: "벨리아의 개입과 1년 회귀",
    paragraphs: [
      "세테라만 저항한 것은 아니었다. 로디니아의 센티넬 벨리아는 자신의 행성이 보이드에 함락되기 직전, 크로노텍터의 힘으로 행성 전체의 시간을 정지시켰다. 얼어붙은 세계를 뒤로하고, 그녀는 마지막 수를 두었다.",
      "벨리아는 새로 센티넬이 된 주인공을 정확히 1년 전 과거로 돌려보냈다. 함께 전해진 말은 단 하나였다. \"미래가 바뀌었다.\" 그녀가 무엇을 보았는지, 왜 하필 주인공이어야 했는지는 여전히 수수께끼로 남아 있다.",
      "과거로 돌아온 주인공 앞에서 벨리아는 크로노텍터의 새로운 힘을, 그리고 센티넬이 지닌 힘의 원천인 매트릭스의 실체를 하나씩 열어 보인다. 아직 오지 않은 멸망을 되돌리기 위한 싸움이다. 크로노 오디세이의 이야기는 여기서 시작된다.",
    ],
    entity_ids: [
      "ENT-VELIA",
      "ENT-RODINIA",
      "ENT-RODINIA-TIME-FREEZE",
      "ENT-ONE-YEAR-REGRESSION",
      "ENT-MATRIX",
      "ENT-PROTAGONIST",
    ],
  },
];

// Per-chapter official screenshots (Steam store page, © Chrono Studio ·
// Kakao Games). Rendered full-bleed like a picture book; the source credit
// lives once at the bottom of the chronicle, not on each figure.
export type ChapterImage = { src: string; alt: string };

export const CHAPTER_SOURCE_URL =
  "https://store.steampowered.com/app/2873440/Chrono_Odyssey/";

export const CHAPTER_IMAGES: Record<string, ChapterImage> = {
  creation: {
    src: "/chronicle/ch1.jpg",
    alt: "금빛 평원 너머로 보이는 첨탑과 하늘의 거대한 기둥",
  },
  wrath: {
    src: "/chronicle/ch2.jpg",
    alt: "무장한 이들이 결이 새겨진 거대한 문 앞으로 걸어가는 모습",
  },
  unleashing: {
    src: "/chronicle/ch3.jpg",
    alt: "잿빛 안개 속에서 쏟아져 나오는 뒤틀린 마물의 무리",
  },
  invasion: {
    src: "/chronicle/ch4.jpg",
    alt: "어두운 숲에서 생존자들 앞에 나타난 거대한 괴수",
  },
  frontier: {
    src: "/chronicle/ch5.jpg",
    alt: "폭포 앞에서 함께 싸우는 마법사와 방패를 든 전사",
  },
  ruins: {
    src: "/chronicle/ch6.jpg",
    alt: "수호상이 내려다보는 고대 유적의 회랑",
  },
  regression: {
    src: "/chronicle/ch7.jpg",
    alt: "잿빛 하늘에서 날개를 펼친 비룡과 마주 선 창을 든 기사",
  },
};
