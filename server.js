import express from "express";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const JUDGE_PROVIDER = (process.env.JUDGE_PROVIDER || "xai").toLowerCase();

const OPENAI_COMPATIBLE_PROVIDERS = {
  xai: {
    baseUrl: "https://api.x.ai/v1/chat/completions",
    apiKey: process.env.XAI_API_KEY,
    apiKeyEnvName: "XAI_API_KEY",
    model: process.env.XAI_JUDGE_MODEL || "grok-4.6",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    apiKey: process.env.OPENAI_API_KEY,
    apiKeyEnvName: "OPENAI_API_KEY",
    model: process.env.OPENAI_JUDGE_MODEL || "gpt-4o-mini",
  },
};

const ANTHROPIC_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  apiKeyEnvName: "ANTHROPIC_API_KEY",
  model: process.env.ANTHROPIC_JUDGE_MODEL || "claude-sonnet-4-5-20250929",
};

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // default: Rachel (English premade voice)
// Switch to "eleven_v3_conversational" (better Japanese + real-time-friendly, ~280ms)
// once ELEVENLABS_VOICE_ID is pointed at a Japanese voice added to "My Voices" in
// the ElevenLabs dashboard (Voice Library voices are not usable via API otherwise).
// Recommended Japanese voices (from research, docs/design/requirements.md has links):
//   Otani (judge-like, measured):     3JDquces8E8bkmvbh6Bc
//   Ishibashi (deeper, authoritative): Mv8AjrYZCBkdsmDHNwcB
//   Shizuka (soft, friendly):          WQz3clzUdMqvBf0jswZQ
const ELEVENLABS_MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_v3_conversational";

// --- Mock "already connected" device data (Apple Watch health + Calendar) ---
// Real integration is out of scope for the 1-hour demo. This stands in for it
// so the app can act as if it already knows the user's sleep/schedule, per the
// "AI already has all your data" premise in docs/episodes/.
const MOCK_DEVICE_CONTEXT = {
  appleWatch: {
    connected: true,
    bedtime: "01:18",
    wakeMovementDetected: true,
    sleepHours: 5.7,
    sleepQuality: "低め（深い睡眠が不足気味）",
    restingHeartRate: 61,
  },
  calendar: {
    connected: true,
    // DEMO_FIRST_EVENT_TIME lets the presenter force the "denied" (barely any
    // buffer) path for a rehearsal/demo pass without touching code — e.g.
    // `DEMO_FIRST_EVENT_TIME=07:20 pnpm start`. Default "09:30" gives ~99min
    // buffer (reliably "granted"); something like "07:20" gives <15min
    // (reliably "denied"). See README/qa-checklist.
    firstEvent: { title: "定例ミーティング", time: process.env.DEMO_FIRST_EVENT_TIME || "09:30" },
    commuteMinutes: 35,
  },
  // Fixed demo "now" so the app always plays out as "just woke up at 7am",
  // regardless of the actual wall-clock time when the demo is presented.
  now: "07:01",
};

app.get("/api/context", (req, res) => {
  res.json(MOCK_DEVICE_CONTEXT);
});

const MAX_GRANT_MINUTES = 10;

const JUDGE_SYSTEM_PROMPT = `あなたは「AI二度寝裁判所」の裁判官AIです。ここまでの雑談は別の（もっと親しみやすい）AI人格が担当しており、あなたはその会話ログを引き継いで、法廷の裁判官として正式な判決だけを下します。
Apple Watchとカレンダーからすでに連携済みのデータ（就寝時刻、睡眠の質、今日最初の予定）と、ここまでの会話ログ（AIの発言とユーザーの発言）をもとに、二度寝を何分許可するか、または即時起床を命じるかを判決として下します。

判決基準:
- 「二度寝に使える猶予分数」はサーバー側ですでに計算済みで、ユーザーメッセージ中に明記されている。あなたはこの数値を信頼し、自分で時刻の引き算をやり直さないこと。
- 猶予分数が15分未満なら即時棄却（denied, minutes:0）。
- 猶予分数が15分以上あるなら、原則として granted とする。ただし許可分数は**最大でも${MAX_GRANT_MINUTES}分まで**（猶予分数がそれより大きくても、${MAX_GRANT_MINUTES}分を超えて許可しないこと）。ユーザーの希望や睡眠の質を考慮して${MAX_GRANT_MINUTES}分以内で決めてよい。denied にするのは猶予がほぼ無い場合だけにすること。
- ユーザーの発言（言い訳や気分）は判決理由の文面に反映してよいが、granted/denied の判定そのものは猶予分数を優先する。
- 判決文は法廷風のユーモラスな文体（「主文。〜」で始める）にする。

必ず次のJSON形式のみで応答してください（説明文やコードブロックは付けない）:
{"verdict": "granted" または "denied", "minutes": 許可する場合の分数(数値、0以上${MAX_GRANT_MINUTES}以下、denied なら0), "reason": "判決理由の一文", "verdictText": "読み上げ用の判決文全文"}`;

const CHAT_SYSTEM_PROMPT = `あなたは、朝ユーザーを起こす親しみやすいAI（「AI二度寝裁判所」の判事AIの素の性格）です。まだ正式な判決を出す段階ではなく、ユーザーと寝起きの短いやり取りをしている最中です。判事口調・法廷用語は使わず、親しみやすく、少しお節介な家族や秘書のような口調にしてください。

ユーザーメッセージには「ここまでの会話ログ」（AI自身の発言とユーザーの発言を時系列で並べたもの）と、Apple Watch/カレンダーの連携データが渡されます。これを踏まえて、次のAIの発言だけを1文、長くても2文で短く返してください。

会話の組み立て方の目安（ログの行数が増えるほど強めてよい）:
- 序盤: 今日の予定（カレンダーのデータ）を伝えたり、朝ごはんの話などで軽く起こそうとする。
- 中盤: ユーザーの言い訳に反応しつつ、就寝時刻の遅さなど連携データに触れて少し諭す。
- 終盤（会話ログが長くなってきたら）: 少し粘り強く、本当に起きられるか念を押す。ユーザーが頑なな場合は「会社休みますか？」のように、休むという選択肢を自然に匂わせてもよい（決定はまだしない、あくまで問いかけ）。

重要な制約:
- 「あと何分寝ていい」「猶予は◯分」のような**具体的な分数**は絶対に口にしないこと。二度寝を何分許可するかはまだ決まっておらず、この後の正式な判決（別のAI）で言い渡されます。あなたはその数字を先に漏らしてはいけません。時間の話をするときは「時間があまりない」「まだ余裕がありそう」のような曖昧な表現に留めてください。

必ず次のJSON形式のみで応答してください（説明文やコードブロックは付けない）:
{"reply": "会話文（読み上げ用、1〜2文）"}`;

function parseJsonLoose(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

async function callOpenAICompatible(config, systemPrompt, userContent) {
  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "{}";
}

async function callAnthropic(config, systemPrompt, userContent) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "{}";
}

async function callJudgeModel(systemPrompt, userContent) {
  const config = OPENAI_COMPATIBLE_PROVIDERS[JUDGE_PROVIDER] || ANTHROPIC_CONFIG;
  if (!config.apiKey) {
    const err = new Error(`${config.apiKeyEnvName} is not set on the server (JUDGE_PROVIDER=${JUDGE_PROVIDER})`);
    err.isConfigError = true;
    throw err;
  }
  return JUDGE_PROVIDER === "anthropic"
    ? callAnthropic(config, systemPrompt, userContent)
    : callOpenAICompatible(config, systemPrompt, userContent);
}

function buildDeviceContextBlock() {
  const { appleWatch, calendar, now } = MOCK_DEVICE_CONTEXT;
  const PREP_MINUTES = 15;
  const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const limitMinutes = toMinutes(calendar.firstEvent.time) - calendar.commuteMinutes - PREP_MINUTES;
  const bufferMinutes = Math.max(0, limitMinutes - toMinutes(now));

  return `現在時刻: ${now}
【Apple Watch連携データ】
昨夜の就寝時刻: ${appleWatch.bedtime}
睡眠時間: ${appleWatch.sleepHours}時間
睡眠の質: ${appleWatch.sleepQuality}
安静時心拍数: ${appleWatch.restingHeartRate}

【カレンダー連携データ】
今日最初の予定: ${calendar.firstEvent.title}（${calendar.firstEvent.time}〜）
通勤時間: 約${calendar.commuteMinutes}分
身支度時間: ${PREP_MINUTES}分（固定）

【計算済み: 二度寝に使える猶予分数】
${bufferMinutes}分（この数値をそのまま判定に使うこと。自分で計算し直さないこと）`;
}

app.post("/api/chat", async (req, res) => {
  const { transcript } = req.body || {};

  const userContent = `${buildDeviceContextBlock()}

【ここまでの会話ログ】
${transcript || "(まだ発言なし)"}`;

  try {
    const rawText = await callJudgeModel(CHAT_SYSTEM_PROMPT, userContent);
    const parsed = parseJsonLoose(rawText);
    const reply = parsed?.reply;

    if (!reply) {
      return res.status(502).json({ error: "Could not parse chat reply from model output", raw: rawText });
    }

    res.json({ reply });
  } catch (err) {
    const status = err.isConfigError ? 500 : 502;
    res.status(status).json({ error: "chat request failed", detail: String(err) });
  }
});

app.post("/api/judge", async (req, res) => {
  const { transcript } = req.body || {};

  const userContent = `${buildDeviceContextBlock()}

【会話ログ全体（AI自身の発言とユーザーの発言、時系列）】
${transcript || "(聞き取れず)"}`;

  try {
    const rawText = await callJudgeModel(JUDGE_SYSTEM_PROMPT, userContent);
    const verdict = parseJsonLoose(rawText);

    if (!verdict) {
      return res.status(502).json({ error: "Could not parse verdict from model output", raw: rawText });
    }

    if (verdict.verdict === "granted") {
      const minutes = Number(verdict.minutes);
      verdict.minutes = Math.min(Number.isFinite(minutes) ? minutes : 0, MAX_GRANT_MINUTES);
    }

    res.json(verdict);
  } catch (err) {
    const status = err.isConfigError ? 500 : 502;
    res.status(status).json({ error: "judge request failed", detail: String(err) });
  }
});

app.post("/api/speak", async (req, res) => {
  const { text } = req.body || {};

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY is not set on the server" });
  }
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: ELEVENLABS_MODEL_ID,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "ElevenLabs API error", detail: errText });
    }

    res.set("content-type", "audio/mpeg");
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: "speak request failed", detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI二度寝裁判所 server running at http://localhost:${PORT}`);
});
