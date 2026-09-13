const screens = {
  alarm: document.getElementById("screen-alarm"),
  form: document.getElementById("screen-form"),
  trial: document.getElementById("screen-trial"),
  verdict: document.getElementById("screen-verdict"),
  execute: document.getElementById("screen-execute"),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[name].classList.add("active");
}

// --- screen 1: alarm ---
document.getElementById("btn-plead").addEventListener("click", () => {
  showScreen("form");
});

// --- screen 2: form + voice input ---
const sleepinessInput = document.getElementById("sleepiness");
const sleepinessValue = document.getElementById("sleepiness-value");
sleepinessInput.addEventListener("input", () => {
  sleepinessValue.textContent = sleepinessInput.value;
});

const noteInput = document.getElementById("note");
const micButton = document.getElementById("btn-mic");
const micStatus = document.getElementById("mic-status");

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognitionCtor) {
  recognition = new SpeechRecognitionCtor();
  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript;
    noteInput.value = transcript;
  });

  recognition.addEventListener("end", () => {
    micButton.classList.remove("listening");
    micStatus.textContent = "";
  });

  recognition.addEventListener("error", (event) => {
    micButton.classList.remove("listening");
    micStatus.textContent = `音声認識エラー: ${event.error}`;
  });

  micButton.addEventListener("click", () => {
    micButton.classList.add("listening");
    micStatus.textContent = "聞いています…";
    recognition.start();
  });
} else {
  micButton.disabled = true;
  micStatus.textContent = "このブラウザは音声入力に対応していません（Chrome推奨）";
}

// --- submit: call /api/judge ---
document.getElementById("btn-submit").addEventListener("click", async () => {
  showScreen("trial");

  const sleepiness = sleepinessInput.value;
  const bedtime = document.getElementById("bedtime").value;
  const firstEventTime = document.getElementById("first-event").value;
  const note = noteInput.value;

  try {
    const res = await fetch("/api/judge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sleepiness, bedtime, firstEventTime, note }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "judge failed");
    }

    const verdict = await res.json();
    renderVerdict(verdict, { bedtime, firstEventTime });
  } catch (err) {
    renderVerdict({
      verdict: "denied",
      minutes: 0,
      reason: "AI裁判所が応答しませんでした（通信エラー）。とりあえず起きましょう。",
      verdictText: "主文。通信障害につき、即時起床を命ずる。",
    }, { bedtime, firstEventTime });
    console.error(err);
  }
});

// --- verdict screen ---
const verdictCard = document.getElementById("verdict-card");
const verdictReason = document.getElementById("verdict-reason");
const verdictAudio = document.getElementById("verdict-audio");
const btnExecute = document.getElementById("btn-execute");

let currentVerdict = null;

function renderVerdict(verdict, context) {
  currentVerdict = { ...verdict, context };
  showScreen("verdict");

  verdictCard.classList.remove("granted", "denied");
  verdictCard.classList.add(verdict.verdict === "granted" ? "granted" : "denied");
  verdictReason.textContent = verdict.verdictText || verdict.reason || "判決不明";

  btnExecute.textContent =
    verdict.verdict === "granted"
      ? `執行する（${verdict.minutes}分後にアラーム再設定）`
      : "起床する（タイマー開始）";

  speakVerdict(verdict.verdictText || verdict.reason || "");
}

async function speakVerdict(text) {
  try {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error("speak failed");

    const blob = await res.blob();
    verdictAudio.src = URL.createObjectURL(blob);
    verdictAudio.play().catch(() => {
      // autoplay blocked; user can press execute to trigger sound via interaction
    });
  } catch (err) {
    console.error(err);
  }
}

btnExecute.addEventListener("click", () => {
  renderExecute(currentVerdict);
});

// --- execute / wake-up screen ---
const executeTitle = document.getElementById("execute-title");
const executeDetail = document.getElementById("execute-detail");

function addMinutes(timeStr, minutes) {
  const [h, m] = timeStr.split(":").map(Number);
  const date = new Date(2000, 0, 1, h, m + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function renderExecute(verdict) {
  showScreen("execute");

  if (verdict.verdict === "granted") {
    const newAlarm = addMinutes(currentTimeGuess(), Number(verdict.minutes) || 0);
    executeTitle.textContent = `${verdict.minutes}分後、必ず起こしますからね`;
    executeDetail.textContent = `次のアラーム: ${newAlarm} ／ 予定は自動で後ろ倒しされました。`;
  } else {
    executeTitle.textContent = "判決は判決。さあ、布団から出よ。";
    executeDetail.textContent = "即時起床が命じられました。";
  }
}

function currentTimeGuess() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

// --- human gate: long-press to call in sick ---
const sickButton = document.getElementById("btn-sick");
let pressTimer = null;

function startPress() {
  sickButton.textContent = "長押し中…";
  pressTimer = setTimeout(() => {
    sickButton.textContent = "本日は休みます（承認済み）";
    sickButton.disabled = true;
  }, 3000);
}

function cancelPress() {
  clearTimeout(pressTimer);
  if (!sickButton.disabled) {
    sickButton.textContent = "本日は休む（3秒長押しで承認）";
  }
}

sickButton.addEventListener("mousedown", startPress);
sickButton.addEventListener("touchstart", startPress);
sickButton.addEventListener("mouseup", cancelPress);
sickButton.addEventListener("mouseleave", cancelPress);
sickButton.addEventListener("touchend", cancelPress);

// --- restart ---
document.getElementById("btn-restart").addEventListener("click", () => {
  sickButton.disabled = false;
  sickButton.textContent = "本日は休む（3秒長押しで承認）";
  showScreen("alarm");
});
