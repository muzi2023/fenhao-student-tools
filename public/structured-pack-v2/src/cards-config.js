import { CARD_POOL as ART_POOL, MASCOT_CONFIG as ORIGINAL_MASCOT } from './art-config.js';
// Adapted from PRISM, Copyright (c) 2026 SimpleMkt, MIT License.
// Six-category questions from fenhao-interview. See question provenance.
export const PACK_BRAND = {
 logo: '结构化', seriesCode: '六类练习 · 01', tearHint: '沿封口撕开 →',
 footerLeft: '分号教育', footerRight: '6 张题卡',
 microSpec: '每天一包 · 六类各一题', backHeadline: '一次抽取六类题目\n每一张，都是一次新的练习', backSpec: 'STRUCTURED INTERVIEW · PRACTICE PACK',
};
export const PACK_THEMES = [{name:'结构化', code:'六大类别',color:'#eb683b',highlight:'#ffc49e',shadow:'#88351b'}];
export const RARITY_META = { common: {rank:1,aura:'transparent',shockColor:'#ffffff',autoFlip:true} };
export const MASCOT_CONFIG = ORIGINAL_MASCOT;
export const QUESTION_CATEGORIES = [
  {
    "id": "relationships",
    "name": "人际交往",
    "questions": [
      "家长反馈学生写作业很墨迹，你怎么办？",
      "班级多名学生长期拖欠作业、学习态度散漫，你如何管理？",
      "班里出现同学抱团孤立学困生的现象，你怎么处理？",
      "学生之间出现矛盾，作为老师，你怎么处理?",
      "某学生一次考试取得了好成绩，班上却有同学反映他作弊，作为老师，你如何处理?",
      "身为班主任，看到老师和学生吵架，你怎么办？",
      "同事在背后议论你的教学工作，你会怎么做？",
      "家长频繁私下给你送礼，希望特殊关照孩子，你怎么应对？"
    ]
  },
  {
    "id": "emergency",
    "name": "应急应变",
    "questions": [
      "自修课上，一个同学总是戴着耳机一边听音乐一边做作业，还说如果不听音乐就做不出来。你该怎么办？",
      "小明在课间被推倒，摔伤，没人理会，作为老师，你会怎么做？",
      "你是一位语文老师，但在课堂上学生发现你读错字，你怎么办？",
      "有同学上课答错问题了，你怎么办?",
      "在课上，学生提问的问题，你一时解答不出来时。作为教师，你应该怎么办?",
      "在学校学生吵起来了，如何处理?",
      "有同学在自习室大声说话，你要怎么做?",
      "一名学生偷了家长的300元钱，他的家长找到你大吵大闹，作为班主任，针对这种情况，你怎么办？"
    ]
  },
  {
    "id": "activities",
    "name": "组织活动",
    "questions": [
      "为了丰富学生课余生活，学校让你负责筹备一次校园文化艺术节，你会怎么做？",
      "学校要开展一次防溺水安全教育主题班会，由你来负责，你会如何组织？",
      "班里要组织一次主题班会，主题是“拒绝校园欺凌”，你会怎么开展？",
      "学校安排你带学生开展一次校外研学实践活动，你会如何组织？",
      "假如去偏远山区支教，你都要做什么准备？",
      "假如你是新生班主任，如何召开第一次家长会？",
      "如果你是一位老师，要组织一次主题班会，你都要做什么准备？",
      "对于家庭好和学习好哪个重要召开主题班会，作为班主任你要如何准备？"
    ]
  },
  {
    "id": "analysis",
    "name": "综合分析",
    "questions": [
      "谈谈你对教育家精神中“启智润心、因材施教的育人智慧”的理解。",
      "你认为教学互动重要吗?",
      "学生想要在寒暑假参加夏令营培训，王老师说没有用你怎么看?",
      "现在不少年轻人不愿从事基层教师工作，你怎么看待这一现象？",
      "有人经常把学生和老师比做老鼠和猫，你怎么看？",
      "没有教不好的学生，只有教不好的老师，你怎么看这句话？",
      "班主任应不应该区别对待学生，你怎么看?",
      "有老师说，知识不等于素养，有素养不需要知识，你怎么看?"
    ]
  },
  {
    "id": "politics",
    "name": "时事政治",
    "questions": [
      "教育是国之大计，党之大计，对此你如何理解?",
      "如何看待四个引路人？",
      "新时代中小学教师职业行为十项准则？",
      "谈谈你对教育家精神的理解",
      "如何理解 “双减” 政策对基础教育的意义？",
      "谈谈你对 “推进教育数字化” 的理解。",
      "如何落实 “教育评价改革”，破除 “唯分数、唯升学”？",
      "谈谈你对 “尊师重教” 的理解，作为教师如何践行？"
    ]
  },
  {
    "id": "career",
    "name": "职业认知",
    "questions": [
      "你觉得教育事业是怎么样的工作？",
      "作为一名新时代的教师，在教育上如何体现创新性？",
      "作为一名教师，你会如何培养学生的科学兴趣？",
      "作为老师如何更快融入教研组，做职业规划需要注意什么？",
      "入职后，发现学校不如你的预期，你会怎么做？",
      "你认为新时代中小学教师应具备哪些核心素养？",
      "作为青年教师，你如何践行新时代师德师风建设要求？",
      "你为什么立志成为一名人民教师？"
    ]
  }
];
const colors = ['#526fc8','#bb7245','#569a83','#9a6db2','#b55b73','#7c8a4a'];
const artIds = ['mochi','voxel','sprout','amethyst','ripple','helios'];
export const CARD_POOL = QUESTION_CATEGORIES.map((c,i) => ({
 ...ART_POOL.find(a=>a.id===artIds[i]),
 id:c.id,name:c.name,tag:'',serial:String(i+1).padStart(2,'0')+' / 06',rarity:'common',rarityMark:'',rarityLabel:'查看题目 ↗',trait:'六类练习 · 随机一题'
}));

// Preserve six distinct collectible identities; lighter art stages keep faces legible.
Object.assign(CARD_POOL[0], {frameBg:'linear-gradient(150deg,#ffe6d7,#f5c6ae 55%,#dca18a)',windowBg:'repeating-radial-gradient(circle at 50% 45%,#ffffff13 0 10px,transparent 12px 23px),radial-gradient(circle at 50% 35%,#ffe0bd,#ee9476 62%,#c36d5b)'});
Object.assign(CARD_POOL[1], {frameBg:'linear-gradient(150deg,#e0efde,#b2d3be 60%,#8cb5a0)',windowBg:'repeating-linear-gradient(130deg,#ffffff13 0 9px,transparent 9px 22px),radial-gradient(circle at 50% 35%,#5ed0a3,#21816b 70%,#165e52)'});
Object.assign(CARD_POOL[2], {frameBg:'linear-gradient(150deg,#edfacb,#cae6a9 60%,#a0c681)',windowBg:'repeating-radial-gradient(ellipse at 50% 90%,#c8f6a31c 0 1px,transparent 2px 16px),radial-gradient(circle at 50% 32%,#b5eaa4,#61a969 66%,#387548)'});
Object.assign(CARD_POOL[3], {frameBg:'linear-gradient(150deg,#6f5baf,#38275c 55%,#211839)',windowBg:'conic-gradient(from 30deg at 50% 45%,#9462d9,#34266f,#7d4fbc,#352264,#a06ad9,#4d3184,#9462d9)'});
Object.assign(CARD_POOL[4], {frameBg:'linear-gradient(145deg,#415ba7,#243666 50%,#182746)',windowBg:ART_POOL.find(a=>a.id==='saturn').windowBg});
Object.assign(CARD_POOL[5], {frameBg:'linear-gradient(130deg,#fff4c2,#e6bc4d 35%,#fff0ac 55%,#d6a439 80%,#f6df8c)',windowBg:'radial-gradient(circle at 50% 48%,#fff8ac80,transparent 60%),repeating-conic-gradient(from 0deg at 50% 48%,#f5b349 0deg 12deg,#ee9477 12deg 24deg,#f3cd61 24deg 36deg)'});
