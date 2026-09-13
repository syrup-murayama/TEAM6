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
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // default ElevenLabs demo voice

const JUDGE_SYSTEM_PROMPT = `あなたは「AI二度寝裁判所」の裁判官AIです。
ユーザーの申立て（眠さレベル1-10、就寝時刻、今日最初の予定の時刻）を審理し、二度寝を何分許可するか、または即時起床を命じるかを判決として下します。

判決基準:
- 今日最初の予定までの残り時間が短いほど、許可時間は短くする。
- 眠さが高いほど、許可時間は長くする傾向にしてよいが、予定に遅れるリスクがある場合は棄却(即時起床)する。
- 判決文は法廷風のユーモラスな文体（「主文。〜」で始める）にする。

必ず次のJSON形式のみで応答してください（説明文やコードブロックは付けない）:
{"verdict": "granted" または "denied", "minutes": 許可する場合の分数(数値、denied なら0), "reason": "判決理由の一文", "verdictText": "読み上げ用の判決文全文"}`;

function parseVerdictJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

async function callOpenAICompatibleJudge(config, userContent) {
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
        { role: "system", content: JUDGE_SYSTEM_PROMPT },
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

async function callAnthropicJudge(config, userContent) {
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
      system: JUDGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): ${await response.text()}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text ?? "{}";
}

app.post("/api/judge", async (req, res) => {
  const { sleepiness, bedtime, firstEventTime, note } = req.body || {};

  const config = OPENAI_COMPATIBLE_PROVIDERS[JUDGE_PROVIDER] || ANTHROPIC_CONFIG;

  if (!config.apiKey) {
    return res.status(500).json({
      error: `${config.apiKeyEnvName} is not set on the server (JUDGE_PROVIDER=${JUDGE_PROVIDER})`,
    });
  }

  const userContent = `眠さレベル: ${sleepiness}/10
昨夜の就寝時刻: ${bedtime}
今日最初の予定の時刻: ${firstEventTime}
ユーザーからの一言: ${note || "(なし)"}`;

  try {
    const rawText =
      JUDGE_PROVIDER === "anthropic"
        ? await callAnthropicJudge(config, userContent)
        : await callOpenAICompatibleJudge(config, userContent);

    const verdict = parseVerdictJson(rawText);

    if (!verdict) {
      return res.status(502).json({ error: "Could not parse verdict from model output", raw: rawText });
    }

    res.json(verdict);
  } catch (err) {
    res.status(502).json({ error: "judge request failed", detail: String(err) });
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
          model_id: "eleven_multilingual_v2",
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
