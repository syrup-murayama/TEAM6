"use strict";

/**
 * AI二度寝裁判所 — フロントエンドのみのモック実装。
 * 実際のAI/カレンダー/アラーム連携は行わず、入力に基づくルールベースの
 * 「判決」ロジックで見た目上の体験を再現する。
 */

// ---- 定数 ----------------------------------------------------------------

const SLEEPINESS_LABELS = {
  1: "全然眠くない",
  2: "まあまあ眠い",
  3: "普通に眠い",
  4: "かなり眠い",
  5: "限界（もう無理）",
};

const SCHEDULE_LABELS = {
  none: "予定なし・休日",
  light: "余裕あり",
  normal: "普通",
  busy: "やや詰まってる",
  critical: "絶対に休めない予定がある",
};

// 予定に応じた「二度寝への寛容度」の重み（正=寛容、負=厳しい）
const SCHEDULE_WEIGHT = {
  none: 6,
  light: 1,
  normal: 0,
  busy: -3,
  critical: -8,
};

const REASON_FLAVORS = [
  "本裁判所は、被告の自己申告する眠気を重要な情状として斟酌する。",
  "睡眠は権利であり義務でもある、という当裁判所の一貫した立場に基づく。",
  "布団という名の証拠物件が、被告の主張を強く補強していることを認める。",
  "枕の温もりが冷めていないことも、本件判断における考慮要素の一つである。",
];

// デモ用の固定スケジュール（本日の予定）
const DEMO_SCHEDULE = [
  { time: "09:00", name: "朝会" },
  { time: "10:30", name: "作業タイム開始" },
];

// ---- ユーティリティ --------------------------------------------------------

function pad2(n) {
  return String(n).padStart(2, "0");
}

function nowHHMM() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const total = ((mins % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

function addMinutesToTime(hhmm, add) {
  return minutesToTime(timeToMinutes(hhmm) + add);
}

function sleepDurationHours(bedtime, wakeTime) {
  const bed = timeToMinutes(bedtime);
  const wake = timeToMinutes(wakeTime);
  const diff = ((wake - bed + 1440) % 1440) || 1440; // 0分は「24時間寝た」扱いにはしない特別扱い不要だが0除算回避
  return diff / 60;
}

function randomCaseNumber() {
  return String(Math.floor(Math.random() * 9000) + 1000);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- 判決ロジック（モックAI） -----------------------------------------------

function judge({ sleepiness, bedtime, wakeTime, schedule }) {
  const sleepHours = sleepDurationHours(bedtime, wakeTime);
  const scheduleWeight = SCHEDULE_WEIGHT[schedule];

  // スコアが高いほど「二度寝を許可すべき」と判断する。
  const score = sleepiness * 3 + scheduleWeight - sleepHours * 2;
  const allow = score > 0;
  const minutes = allow ? Math.min(45, Math.max(3, Math.round(score * 1.5))) : 0;

  return { sleepHours, scheduleWeight, score, allow, minutes };
}

// ---- DOM 参照 ------------------------------------------------------------

const sleepinessInput = document.getElementById("sleepiness");
const sleepinessLabel = document.getElementById("sleepinessLabel");
const bedtimeInput = document.getElementById("bedtime");
const wakeTimeInput = document.getElementById("wakeTime");
const alarmTimeInput = document.getElementById("alarmTime");
const scheduleSelect = document.getElementById("schedule");
const judgeBtn = document.getElementById("judgeBtn");

const verdictPanel = document.getElementById("verdictPanel");
const verdictStamp = document.getElementById("verdictStamp");
const caseNo = document.getElementById("caseNo");
const verdictFacts = document.getElementById("verdictFacts");
const verdictMain = document.getElementById("verdictMain");
const verdictReason = document.getElementById("verdictReason");
const alarmBefore = document.getElementById("alarmBefore");
const alarmAfter = document.getElementById("alarmAfter");
const scheduleList = document.getElementById("scheduleList");

const skipWorkBtn = document.getElementById("skipWorkBtn");
const skipResult = document.getElementById("skipResult");

// ---- 初期化 --------------------------------------------------------------

function initDefaults() {
  const now = nowHHMM();
  wakeTimeInput.value = now;
  alarmTimeInput.value = now;
  sleepinessLabel.textContent = SLEEPINESS_LABELS[sleepinessInput.value];
}

sleepinessInput.addEventListener("input", () => {
  sleepinessLabel.textContent = SLEEPINESS_LABELS[sleepinessInput.value];
});

// ---- 判決ボタン ----------------------------------------------------------

judgeBtn.addEventListener("click", () => {
  const input = {
    sleepiness: Number(sleepinessInput.value),
    bedtime: bedtimeInput.value || "00:00",
    wakeTime: wakeTimeInput.value || nowHHMM(),
    schedule: scheduleSelect.value,
  };

  const result = judge(input);
  renderVerdict(input, result);
});

function renderVerdict(input, result) {
  const scheduleLabel = SCHEDULE_LABELS[input.schedule];
  const sleepHoursText = result.sleepHours.toFixed(1);

  caseNo.textContent = `事件番号：眠第${randomCaseNumber()}号`;

  verdictFacts.textContent =
    `被告（あなた）は、就寝時刻 ${input.bedtime} から起床時刻 ${input.wakeTime} まで` +
    `約${sleepHoursText}時間の睡眠を取ったと申告し、現在の眠気を ` +
    `「${SLEEPINESS_LABELS[input.sleepiness]}」、本日の予定を「${scheduleLabel}」と主張している。`;

  if (result.allow) {
    verdictStamp.textContent = "認容";
    verdictStamp.classList.remove("denied");
    verdictMain.textContent = `被告に対し、あと${result.minutes}分間の二度寝を許可する。`;
  } else {
    verdictStamp.textContent = "却下";
    verdictStamp.classList.add("denied");
    verdictMain.textContent = "被告の二度寝の訴えを棄却する。直ちに起床せよ。";
  }

  verdictReason.textContent =
    `総合考慮スコア ${result.score.toFixed(1)} 点（睡眠時間・眠気・本日の予定を加味）。` +
    pickRandom(REASON_FLAVORS);

  // アラーム・予定の後ろ倒しプレビュー
  const alarm = alarmTimeInput.value || nowHHMM();
  alarmBefore.textContent = alarm;
  alarmAfter.textContent = result.allow ? addMinutesToTime(alarm, result.minutes) : alarm;

  scheduleList.innerHTML = "";
  DEMO_SCHEDULE.forEach((ev) => {
    const li = document.createElement("li");
    const newTime = result.allow ? addMinutesToTime(ev.time, result.minutes) : ev.time;
    li.innerHTML =
      `<span class="old-time">${ev.time}</span>` +
      `<span class="new-time">${newTime}</span>` +
      `<span>${ev.name}</span>`;
    scheduleList.appendChild(li);
  });

  verdictPanel.hidden = false;
  verdictPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ---- 人間ゲート：長押しで欠勤確定 -------------------------------------------

const HOLD_DURATION_MS = 2000;
let holdTimer = null;

function startHold() {
  if (skipWorkBtn.classList.contains("confirmed")) return;
  skipWorkBtn.classList.add("charging");
  holdTimer = setTimeout(confirmSkipWork, HOLD_DURATION_MS);
}

function cancelHold() {
  if (skipWorkBtn.classList.contains("confirmed")) return;
  clearTimeout(holdTimer);
  skipWorkBtn.classList.remove("charging");
}

function confirmSkipWork() {
  skipWorkBtn.classList.remove("charging");
  skipWorkBtn.classList.add("confirmed");
  skipWorkBtn.querySelector(".btn-label").textContent = "本日欠勤：承認済み";
  skipResult.textContent =
    "✅ 本人確認による長押し承認が完了しました（人間ゲート通過・AIはこの決定に関与していません）。";
}

skipWorkBtn.addEventListener("pointerdown", startHold);
skipWorkBtn.addEventListener("pointerup", cancelHold);
skipWorkBtn.addEventListener("pointerleave", cancelHold);
skipWorkBtn.addEventListener("pointercancel", cancelHold);

// ---- 起動 ----------------------------------------------------------------

initDefaults();
