# AI二度寝裁判所

朝の二度寝を AI 裁判官に申し立て、許可（◯分だけ二度寝）または棄却（即起床）の判決を声で言い渡すジョークアプリです。最初の1タップ（アラーム停止）以外は音声で完結し、「会社を休む」だけは AI が単独で確定せず、3秒長押しの人間承認が必要です。

## セットアップ

前提: Node.js と [pnpm](https://pnpm.io/)（このリポジトリは `packageManager: pnpm@12.4.1`）。TTS 公開用トンネルを使う場合は [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) も必要です（`brew install cloudflared`）。

1. 依存関係を入れる

   ```bash
   pnpm install
   ```

2. 環境変数を用意する

   ```bash
   cp example.env .env
   ```

   `.env` を開き、使うプロバイダの API キーを埋める。`.env` は `.gitignore` 済み。リポジトリは public なのでキーをコミットしないこと。

3. サーバを起動する

   ```bash
   pnpm start
   ```

   既定は <http://localhost:3000>（`PORT` で変更可）。

## 判決プロバイダ（`JUDGE_PROVIDER`）

`/api/judge` の呼び出し先は環境変数 `JUDGE_PROVIDER` で切り替えます。コード変更は不要です。値は `xai` / `openai` / `anthropic`（未設定時は `xai`）。

選んだプロバイダのキーだけ必須です。

| `JUDGE_PROVIDER` | 必須キー | モデル（任意、未設定時の既定） |
|---|---|---|
| `xai` | `XAI_API_KEY` | `XAI_JUDGE_MODEL`（既定 `grok-4.6`） |
| `openai` | `OPENAI_API_KEY` | `OPENAI_JUDGE_MODEL`（既定 `gpt-4o-mini`） |
| `anthropic` | `ANTHROPIC_API_KEY` | `ANTHROPIC_JUDGE_MODEL`（既定 `claude-sonnet-4-5-20250929`） |

`ELEVENLABS_API_KEY` は `/api/speak`（挨拶と判決の読み上げ）で常に必要です。`ELEVENLABS_VOICE_ID` は任意（未設定時は ElevenLabs のデモ用 voice）。

## デモを外部公開する

サーバを動かしたまま、別ターミナルで:

```bash
pnpm tunnel
```

`cloudflared` が `https://*.trycloudflare.com` の URL を表示するので、それを共有します。無料の quick tunnel は起動のたびに URL が変わるため、再起動したら URL を配り直してください。

音声入力（Web Speech API）は **Chrome** 想定で、マイク権限と HTTPS（localhost またはトンネル URL）が必要です。通し確認は [docs/presentation/qa-checklist.md](docs/presentation/qa-checklist.md) を使ってください。

Apple Watch とカレンダーはデモ用にサーバー側でモック連携済みです（実デバイス / 実カレンダー API は呼ばない）。`GET /api/context` がそのデータを返し、`POST /api/judge` はクライアントから `{ transcript }` だけを受け取り、サーバー側のモック（就寝時刻・睡眠の質・今日最初の予定など）と合成して判決します。

判定は「今日最初の予定までの猶予分数」をサーバー側で計算し、15分未満なら棄却・15分以上なら原則許可というルールで行います（LLMに時刻の引き算をさせると不安定だったため、計算はサーバー側で固定しています）。既定（`09:30`の予定）だと猶予が約99分あり、ほぼ確実に許可になります。棄却パターンをデモしたい場合は、猶予がほぼ無いシナリオで起動し直してください:

```bash
DEMO_FIRST_EVENT_TIME=07:20 pnpm start
```

## 画面構成

最初の1タップ以外は音声で進みます。

1. アラームをタップで止める（ブラウザの自動再生制限を外す唯一の操作）
2. AI が話しかける（「起きた…？　それとも、まだ…？」を自動再生）
3. 自動で聞く（マイクがオンになり、ユーザーは操作しない）
4. 審理（発話テキスト ＋ サーバー側の Watch/カレンダーモック）
5. 判決を声で宣告し、執行画面へ自動遷移（許可ならアラーム・予定を後ろ倒し、棄却なら起床促し）
6. 欠勤だけ 3 秒長押しで人間が承認

詳細は [docs/design/requirements.md](docs/design/requirements.md) の「コア体験フロー（v2: 音声ファースト）」と [docs/design/screen-flow.md](docs/design/screen-flow.md)。
