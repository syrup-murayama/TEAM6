# AI二度寝裁判所 — CM動画（ユーザーストーリー動画）生成プロンプト集

Status: プロンプトのみ（実際の動画生成は未実行）。KlingAI・Gemini(Veo 3)に投げてCM動画を作るためのプロンプト集。

Base docs: `docs/episodes/episode-2-morning-call.md`（ユーザーストーリー原作）、`docs/presentation/klingai-video-brief.md`（`ginana0015-creator/presentation-deck` ブランチ、世界観カット用の既存brief。キャラクター"Judge Clocky"の設定はここで確立され、本ドキュメントでもそのまま流用している）。

> 本ドキュメントは「スライドの穴埋め用カット」ではなく、**独立した1本のCM（ユーザーストーリー動画）**として使えるプロンプトをまとめたもの。尺違いで2バージョンある：フル版（約38〜40秒・8カット）と、15秒版（3カットに圧縮・最終推奨）。

---

## 共通キャラクター＆スタイル定義（全ツール・全カット共通・改変禁止）

`klingai-video-brief.md` の定義と一字一句同じ。キャラクター崩れ防止のため、必ずそのままコピペで使うこと。

**`[CHARACTER]`**
```
"Judge Clocky": a round-bodied vintage twin-bell alarm clock character, cream-white ceramic-like body (#F5E9D3), two brass bell domes on top like rounded ears (#D4AF37 gold trim), a simple round analog clock face with big cartoon eyes and a soft friendly smile, short stubby cylindrical arms and legs, no visible human skin, Pixar-and-Disney-inspired stylized 3D character design, smooth matte material with soft subsurface scattering
```

**`[STYLE]`**
```
warm sunrise gradient background transitioning from soft orange (#FF9E6D) near the horizon to dusty purple (#6B5B95) higher up, soft volumetric light rays through a window, gentle bloom and rim light, cinematic stylized 3D-animated short-film look, shallow depth of field, smooth steady camera motion, no fast cuts, no camera shake, 24fps motion blur, no on-screen text, no subtitles, no watermark, no logo
```

**`[NEGATIVE]`（KlingAI用共通ネガティブ）**
```
photorealistic human face, realistic human skin, horror, dark or scary mood, blurry, out of focus, distorted anatomy, extra limbs, extra fingers, mutated hands, deformed face, low quality, jpeg artifacts, flicker, glitch, morphing character design, inconsistent character design, fast erratic camera shake, on-screen text, subtitles, watermark, logo, multiple conflicting light sources
```

---

## 推奨：15秒版（3カット×5秒）

3カットに絞り、「寝ぼけて申し立てる→AIが判決（グリーンのハンコ）→人間が長押しで大きな決断を守る」という核心だけを見せる構成。KlingAIは通常5秒/10秒単位、Veo(Gemini)は標準8秒生成が多いため、Veoは8秒で生成して5秒にトリムする前提。

| # | 内容 | 尺 |
|---|---|---|
| 1 | アラームが鳴る＋寝ぼけ声で「まだ眠いよ…」 | 5秒 |
| 2 | AI裁判官がハンコを押す＋判決の声「二度寝を9分だけ認める」 | 5秒 |
| 3 | 3秒長押しゲート＋タグライン「小さな判断はAIに。人生の判断は、わたしに。」 | 5秒 |

### KlingAI用プロンプト（音声なし）

**カット1｜アラーム＋申し立て**
```
[CHARACTER], with a sleepy half-closed-eyes expression, vibrates and rings loudly on a wooden bedside table. A blanket-covered figure softly stirs. The character leans slightly toward a small glowing phone on the blanket, its microphone icon pulsing with soft light waves. Camera starts as a medium shot of the nightstand and bed, then performs a slow smooth push-in toward the character and the glowing phone.
[CHARACTER]
[STYLE]
```
ネガティブ追加：`readable text on phone screen, aggressive expression`　／　Duration 5秒・Zoom弱・Panなし

**カット2｜判決（許可・グリーン）**
```
A large ornate wooden stamp, held by [CHARACTER]'s stubby arm from off-screen above, slams down dramatically onto an unfurled scroll-like certificate card centered in frame. On impact, glowing green (#4CAF50) light particles burst outward and a warm golden rim light flares around the card. Celebratory, satisfying mood. Camera is a static close-up centered on the certificate, with a brief slow-motion moment exactly at the instant of impact.
[CHARACTER]
[STYLE]
```
ネガティブ追加：`stamp breaking the card, card tearing, multiple stamps`　／　Duration 5秒・固定カメラ・生成は複数回試行して選ぶ

**カット3｜人間ゲート＋タグライン**
```
An extreme close-up of a human hand's finger firmly pressing and holding down a large round red button on a softly glowing panel. A thin circular progress ring around the button slowly fills with warm golden light at a deliberate, unhurried pace. Background is a softly blurred warm sunrise bedroom (shallow depth of field). The mood is calm, serious, and deliberate — a quiet moment of personal resolve. Camera holds a completely static extreme close-up on the finger and button.
[CHARACTER]
[STYLE]
```
ネガティブ追加：`button breaking, finger releasing early, comedic exaggerated expression, multiple hands`　／　Duration 5秒・完全固定・タグラインは編集で後乗せテロップ推奨

### Gemini（Veo 3）用プロンプト（音声・セリフ込み、各8秒生成→5秒にトリム）

**カット1｜アラーム＋申し立て**
```
A cozy stylized 3D-animated bedroom at dawn, warm sunrise gradient light in orange and dusty purple streaming through a window. "Judge Clocky", a round cream-white vintage twin-bell alarm clock character with big cartoon eyes and gold bell-dome ears, rings loudly on a wooden nightstand, eyes half-closed and sleepy, then leans toward a small glowing phone on the blanket as its microphone icon pulses. A blanket-covered figure stirs slightly. Camera: medium shot, slow smooth push-in toward the character and phone. Audio: a cheerful analog alarm bell, then a sleepy young adult voice (off-camera, groggy, close-mic) says softly in Japanese: "まだ眠いよ…". Soft ambient morning room tone underneath.
```

**カット2｜判決（許可・グリーン）**
```
A large ornate wooden stamp slams down onto an unfurled scroll-like certificate card centered in frame, held by an off-screen stubby cartoon arm. On impact, glowing green light particles burst outward and a warm golden rim light flares around the card. A warm, gentle, slightly formal male voice (the judge character) declares in Japanese with clear diction: "主文。二度寝を、9分間だけ認める。" Camera: static close-up on the certificate with a brief slow-motion moment at the instant of impact. Audio: a heavy satisfying stamp impact sound, a sparkling chime, then the judge's voice line clearly audible over a soft triumphant musical swell.
```

**カット3｜人間ゲート＋タグライン**
```
An extreme close-up of a human hand's finger firmly pressing and holding down a large round red button on a softly glowing panel. A thin circular progress ring around the button slowly fills with warm golden light over a few seconds. Background is a softly blurred warm sunrise bedroom. The mood is calm, serious, and deliberate compared to earlier playful scenes. A quiet, sincere voice narrates in Japanese: "小さな判断はAIに。人生の判断は、わたしに。" Camera: completely static extreme close-up on the finger and button. Audio: a soft rising tone building as the ring fills, a gentle confirmation chime as it completes, the narration voice line clearly audible, calm ambient tone underneath.
```

### 編集メモ（15秒版）
- KlingAI版は音声・BGM・ナレーションなしなので、3カットをつないだ後にElevenLabs音声（アプリと同じ判決文・声質）とBGMを別途乗せる。
- Veo版はセリフ入りで生成されるが、日本語の発音品質にばらつきが出やすいので、聞き取りにくい場合はElevenLabs音声に差し替え可能なように「セリフなしバージョン」も1本ずつ追加生成しておくと安全。
- タグライン文字・ロゴ・作品名は動画内に焼き込ませず、編集ソフトでテロップ／エンドカードとして後乗せする。
- 各カットは複数バリエーション生成し、特にカット2（判決の瞬間）とカット3（長押し）は「一番説得力のある1本」を選ぶことを優先する。

---

## フル版：8カット・約38〜40秒（`docs/episodes/episode-2-morning-call.md` 準拠のユーザーストーリー全体を見せたい場合）

| # | シーン内容 | 尺 |
|---|---|---|
| 1 | 朝7時、アラームが鳴る。まだ眠いキャラ | 4〜5秒 |
| 2 | ユーザーが声で「まだ眠い…」と申し立てる | 4秒 |
| 3 | AI裁判官が木槌を鳴らし審理 | 4秒 |
| 4 | 判決「あと9分、寝てよし。」グリーンのハンコ＋音声宣告 | 6秒 |
| 5 | アラーム・予定が後ろ倒しされるタイムラプス | 5秒 |
| 6 | 別の日、眠さ10/10。判決「即起床。」レッドのハンコ＋起き上がり | 5秒 |
| 7 | 「会社を休もうかな」→3秒長押しゲート | 6秒 |
| 8 | クロージング：タグライン＋ロゴカード | 5秒 |

シーン1・3・4(許可/棄却)・5・7は `docs/presentation/klingai-video-brief.md` の既存プロンプト（シーン1・3・4・5a・6）をそのまま使用する。以下は本ドキュメントで新規追加した2シーン。

### シーン2｜声での申し立て（新規・KlingAI）
```
[CHARACTER] tilts its head slightly toward a small glowing phone-shaped device lying on the blanket, its microphone icon pulsing with soft light waves as if listening. The character's mouth opens slightly as if speaking softly, small musical-note-like sound wave ripples visible in the air between the character and the phone. Sleepy, intimate, quiet morning mood. Camera holds a static close-up shot on the character and the glowing phone.
[CHARACTER]
[STYLE]
```
ネガティブ追加：`readable text on phone screen, phone screen displaying UI, aggressive shouting expression`
設定目安：Duration 4秒 / Zoom・Pan: なし。

### シーン8｜クロージング（新規・KlingAI、推奨は編集ソフトでのテロップ合成）
```
[CHARACTER] stands confidently in a warm, softly glowing courtroom-podium silhouette, gently waving one stubby arm toward the camera in a friendly farewell gesture, as soft golden particles drift upward around it. Warm, hopeful, reassuring closing mood.
[CHARACTER]
[STYLE]
```
ネガティブ追加：`on-screen text, logo, subtitles`（ロゴ・コピーは後乗せするため）
設定目安：Duration 5秒 / Zoom: 弱いプルバック。

### フル版・Gemini(Veo 3)用プロンプト（音声・セリフ込み）

**シーン1｜アラーム発火**
```
A cozy stylized 3D-animated bedroom at dawn, warm sunrise light in orange and dusty purple gradients streaming through a window. "Judge Clocky", a round cream-white vintage twin-bell alarm clock character with big cartoon eyes and gold bell-dome ears, rings loudly and shakes on a wooden nightstand, its eyes half-closed and sleepy. A blanket-covered figure on the bed stirs slightly. Camera: static medium shot, then a slow smooth push-in toward the clock. Audio: a cheerful analog alarm bell ringing, soft ambient birds outside, gentle morning room tone, no dialogue yet.
```

**シーン2｜声での申し立て**
```
Continuing the same cozy dawn bedroom scene, "Judge Clocky" leans its round head toward a small glowing phone on the blanket, its microphone icon pulsing. A sleepy young adult voice (off-camera, close-mic, groggy tone) says softly in Japanese: "まだ眠いよ…". Camera: static close-up on the character and the glowing phone. Audio: soft rustle of blankets, faint ambient room tone, the sleepy voice line clearly audible, no music yet.
```

**シーン3｜開廷中（審理）**
```
"Judge Clocky" now wearing a small oversized black judge's robe with gold trim and a tiny judge's cap, stands behind a miniature wooden podium and bangs a small wooden gavel down twice with a satisfying thud. A golden hourglass floats beside the podium with sand steadily falling. Warm sunrise-gradient background, cinematic stylized 3D-animated short-film look. Camera: static medium shot from a slightly low angle. Audio: two crisp wooden gavel knocks, a soft magical chime as the hourglass sand falls, light orchestral courtroom sting building tension playfully, no dialogue.
```

**シーン4｜判決（許可・グリーン）**
```
A large ornate wooden stamp slams down onto an unfurled scroll-like certificate card centered in frame, held by an off-screen stubby cartoon arm. On impact, glowing green light particles burst outward and a warm golden rim light flares around the card. Immediately after, a warm, gentle, slightly formal male voice (the judge character) declares in Japanese with clear diction: "主文。申立人の二度寝を、9分間に限り認める。ただし9分経過後の即時起床を条件とする。" Camera: static close-up on the certificate with a brief slow-motion moment at the instant of impact. Audio: a heavy satisfying stamp impact sound, sparkling chime for the light burst, then the judge's voice line clearly audible over a soft triumphant musical swell.
```

**シーン5｜アラーム・予定の後ろ倒し**
```
A stylized round digital alarm clock display, cream-white and gold to match "Judge Clocky", smoothly slides and morphs its glowing digital numbers forward in time, beside a small floating schedule list card whose time labels gently shift like gears quietly re-aligning. Warm, reassuring, orderly mood. Camera: static medium shot, no movement. Audio: soft mechanical ticking and gentle gear-shifting sounds, a warm reassuring ambient synth pad, no dialogue.
```

**シーン6｜別の日：即起床（棄却・レッド）**
```
The same certificate card setup, but this time the wooden stamp slams down with a firm decisive impact and glowing red light particles burst outward with a sterner reddish rim light. A firm but still friendly male judge voice declares in Japanese: "主文。申立人の二度寝の訴えを棄却する。10時の会議を鑑み、直ちに起床すべし。" Immediately after, "Judge Clocky" is shown standing upright, stretching its stubby arms upward with a determined, no-longer-sleepy expression. Camera: static close-up on the stamp impact, then a quick cut to a medium shot of the character stretching. Audio: a firm stamp impact sound, the judge's voice line, then an upbeat energetic sting as the character wakes up decisively.
```

**シーン7｜人間ゲート（3秒長押し）**
```
An extreme close-up of a human hand's finger firmly pressing and holding down a large round red button on a softly glowing panel. A thin circular progress ring around the button slowly fills with warm golden light over a few seconds. The background is a softly blurred warm sunrise bedroom. The mood shifts more serious, calm, and deliberate than earlier playful scenes. A quiet, sincere young adult voice (off-camera) narrates in Japanese: "小さな判断は、AIに。人生の判断は、わたしに。" Camera: completely static extreme close-up on the finger and button. Audio: a soft rising tone that builds as the ring fills, a gentle confirmation chime exactly as the ring completes, calm ambient room tone underneath, the narration voice line clearly audible.
```

**シーン8｜クロージング**
```
A clean, softly glowing courtroom-podium silhouette scene fading to a warm gradient background, with "Judge Clocky" giving a friendly small wave toward the camera. Audio: a warm, gentle closing musical phrase, soft applause-like sparkle sound, no dialogue — leave clean space for a title card and logo to be added in post-production, no on-screen text rendered by the model itself.
```

---

## 運用メモ（全バージョン共通）
- Veo/Gemini側の日本語セリフは品質にばらつきが出やすいので、生成後に必ず確認し、聞き取りにくい場合はアプリと同じElevenLabs音声（`eleven_v3_conversational`、判決文は`server.js`の`JUDGE_SYSTEM_PROMPT`と同じ文体）に差し替える。
- KlingAI・Veoとも文字の焼き込みはさせない方針を維持し、日本語テロップ・ロゴ・タイトルは編集ソフトで後乗せする。
- 最大の見せ場（判決の瞬間／人間ゲート）は複数バリエーション生成して一番良いものを選ぶ運用にする。
- 生成素材は `docs/presentation/assets/scene-N-用途名.mp4` の命名規則で保存し、既存の `klingai-video-brief.md` 由来の素材と混在させずに管理する。
