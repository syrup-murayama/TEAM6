# AI二度寝裁判所 — KlingAI 動画生成 要件定義書 & ユーザーストーリー

Status: ドラフト（実装未完了のため、実画面キャプチャの代わり／補完としてAI生成動画を使う前提で作成）
Base docs: `docs/design/requirements.md`, `docs/design/screen-flow.md`, `docs/episodes/asuka.md`, `docs/episodes/episode-2-morning-call.md`, `docs/presentation/pitch.md`

> 目的は「実装が間に合わなかった場合の保険」と「実装が間に合っても、朝焼けの寝室や裁判官キャラのような、実装では作り込めない世界観カットで発表の説得力を上げること」の両方。KlingAIで生成したクリップは `docs/presentation/pitch.md` のスライド4〜6（デモ導入・判決画面ハイライト・人間ゲートハイライト）で、実スクリーンショットが無い/足りない箇所に差し込む想定。

---

## 1. 要件定義書

### 1.1 目的・背景

- 本ハッカソンは1時間の時間制約があり、`docs/design/requirements.md` のタイムボックスどおり実装が間に合わない、または音声入出力などの一部機能が縮退する可能性がある。
- `docs/presentation/pitch.md` のデモの見せ場（判決画面＝最大の見せ場、人間ゲート＝オチ）は、UIのスクリーンショットだけでは「朝焼けの寝室」「AI裁判官キャラ」「ハンコがドンと押される」といった**世界観・情緒**が伝わりにくい。
- そこでKlingAI（text-to-videoまたはimage-to-video）を使い、実装済みUIでは表現しきれない**世界観カット（オープニング／判決の瞬間の演出／人間ゲートの緊張感）**を短い動画クリップとして生成し、発表冒頭のフックやスライドの背景・差し込み映像に使う。

### 1.2 成果物として必要なもの

| # | 用途 | 使用箇所 | 優先度 |
|---|---|---|---|
| 1 | オープニング用の朝の寝室カット（アラーム発火の瞬間） | 発表冒頭のつかみ／スライド1〜2の背景 | 高 |
| 2 | 判決の瞬間（ハンコがドンと押される演出） | スライド5（判決画面ハイライト）、実スクショが無い場合の主役カット | **最優先** |
| 3 | 人間ゲート（3秒長押しで確定する指のクローズアップ） | スライド6（人間ゲートハイライト）、オチの説得力を支える | **最優先** |
| 4 | AI裁判官キャラが木槌を鳴らす「開廷中」カット | スライド4のつなぎ、なくても代替可 | 中 |
| 5 | 執行（アラーム/予定が後ろ倒しされる時計のタイムラプス） | スライド5の補足、なくても代替可 | 低 |

優先度「最優先」の2つ（判決の瞬間／人間ゲート）だけは必ず用意する。時間が足りない場合は他を諦めてこの2つに生成の試行回数を集中させる（`docs/presentation/pitch.md` の「削る優先順位」と同じ考え方）。

### 1.3 動画仕様

- **尺**：1クリップ 4〜6秒（KlingAIの標準的な1生成あたりの尺に合わせる。長い尺が必要な場合は複数クリップを編集でつなぐ）
- **アスペクト比**：16:9（スライド埋め込み・プロジェクター投影を想定。SNS用に別途9:16が欲しい場合はクロップで対応し、生成し直さない）
- **解像度**：KlingAIの標準出力設定で可（1080p相当があれば選択）
- **本数**：最大5クリップ（表の5用途分）。うち2本（判決の瞬間／人間ゲート）は複数バリエーションを生成して選ぶ余地を残す
- **音声**：KlingAI生成側の音声は使わない（BGM・効果音・ナレーションは編集時に別途追加、または発表当日は無音のBGVとして流す）
- **文字**：動画内に文字を焼き込ませない（AI生成動画のテキストは崩れやすく信頼できないため）。判決文などのテキストは編集ソフトでテロップとして後乗せする、または口頭ナレーション/スライド側のテキストで補う

### 1.4 ビジュアルスタイルガイド（`docs/design/screen-flow.md` 準拠）

全クリップで以下のトーンを統一する。バラバラな絵柄にならないよう、プロンプトの末尾に共通のスタイルタグを毎回付ける。

- **配色**：朝焼けグラデーション（オレンジ→パープル）を基調。判決が「許可」のときはグリーン系アクセント、「棄却」のときはレッド系アクセントを差し色に使う
- **トーン**：法廷のモチーフ（木槌・ハンコ・巻物・裁判官のガウン）をポップでビビッドな色使いに崩した、コミカルで温かみのある3Dアニメ/イラスト調（実写ではなくアニメーション調を推奨——実写だと安っぽく見えるリスクが高い）
- **キャラクター**：目覚まし時計を擬人化したマスコット（寝ぼけ顔）。裁判官はこのマスコットの「上位人格」という設定なので、同一キャラのバリエーション（法服を着た同じ時計マスコット）として一貫させる
- **カメラワーク**：過度に速いカット/揺れは避け、ゆったりしたパン・ズームで「安心感」を出す（このプロダクトの結論は「迷いから解放される」なので、映像も落ち着いたテンポにする）

### 1.5 KlingAI運用上の注意（制約を踏まえた進め方）

- プロンプトは英語で書く（日本語よりも安定した出力が期待できるため）。日本語の意図はこのドキュメントの解説文で管理し、実際に投げるのは英訳済みプロンプト（2章に記載）
- 1シーンにつき複数回生成し、スタイル・構図が一番安定しているものを採用する（初回で決め打ちしない）
- キャラクターの一貫性を出したい場合は、最初に生成した1枚の静止画/1本の動画の先頭フレームを参照画像として次のシーンの image-to-video 入力に使う（KlingAIの image-to-video 機能がある場合）
- 生成した素材は `docs/presentation/assets/`（未作成の場合は生成時に作る）に保存し、ファイル名は `scene-N-用途名.mp4` の命名規則にする
- 著作権・利用規約上、生成物をそのまま公開資料に使ってよいか（商用/イベント利用条件）はKlingAI側の利用規約を確認してから最終版に使うこと（本ドキュメントの範囲外だが、発表資料に載せる前に必ず確認する）

### 1.6 スコープ外

- リップシンクや正確なセリフの音声同期（テキスト読み上げはElevenLabs側で別途対応、`docs/design/requirements.md` 参照）
- 実UIの操作を正確になぞる画面録画的な再現（KlingAIは実UIキャプチャの代替ではなく、世界観・情緒を補うカット用途に限定する）
- 長尺のストーリー動画（今回は発表内で使う数秒〜十数秒のカット素材が目的で、独立した短編映像作品は作らない）

---

## 2. ユーザーストーリー（シーン台本 / KlingAI詳細プロンプト集）

各シーンは「日本語での意図」→「ショット設計（画角・カメラワーク・尺）」→「そのまま貼り付け可能な英語プロンプト」→「ネガティブプロンプト」→「KlingAI設定の目安」の順で記載。キャラクターやライティングの表記をシーンごとにブレさせないよう、2.1のキャラクター＆スタイルバイブルの文言を毎回一字一句そのまま使い回すこと（言い換えない）。

### 2.1 キャラクター＆スタイルバイブル（全シーン共通・改変禁止）

一貫性がKlingAI生成で最も崩れやすいポイントは「キャラクターデザイン」と「配色」。以下のブロックをすべてのプロンプトに**そのままコピペで**含める。

**`[CHARACTER]`（キャラクター定義ブロック）**：
```
"Judge Clocky": a round-bodied vintage twin-bell alarm clock character, cream-white ceramic-like body (#F5E9D3), two brass bell domes on top like rounded ears (#D4AF37 gold trim), a simple round analog clock face with big cartoon eyes and a soft friendly smile, short stubby cylindrical arms and legs, no visible human skin, Pixar-and-Disney-inspired stylized 3D character design, smooth matte material with soft subsurface scattering
```

**`[STYLE]`（画づくり・ライティング共通ブロック）**：
```
warm sunrise gradient background transitioning from soft orange (#FF9E6D) near the horizon to dusty purple (#6B5B95) higher up, soft volumetric light rays through a window, gentle bloom and rim light, cinematic stylized 3D-animated short-film look, shallow depth of field, smooth steady camera motion, no fast cuts, no camera shake, 24fps motion blur, no on-screen text, no subtitles, no watermark, no logo
```

**`[NEGATIVE]`（共通ネガティブプロンプト。KlingAIのnegative prompt欄にそのまま貼る）**：
```
photorealistic human face, realistic human skin, horror, dark or scary mood, blurry, out of focus, distorted anatomy, extra limbs, extra fingers, mutated hands, deformed face, low quality, jpeg artifacts, flicker, glitch, morphing character design, inconsistent character design, fast erratic camera shake, on-screen text, subtitles, watermark, logo, multiple conflicting light sources
```

**KlingAI共通設定の目安**（機能名はUI更新で変わる可能性があるため、近い項目を選ぶ）：
- モード：Professional / High-consistency 系（画質・一貫性優先モードがあれば選択。Standardしかない場合はそのまま可）
- Duration：5秒（選べる場合。10秒しか無ければ10秒で生成しトリムする）
- Aspect ratio：16:9
- Creativity / Flexibility（自由度スライダー）：中〜低寄り（プロンプトからの逸脱を抑え、キャラ崩れを防ぐ）
- CFG / Prompt adherence（プロンプト忠実度）：高め
- Camera control（カメラ操作スライダーがある場合）：Zoom/Panは「弱〜中」、Shakeは必ず「なし／最小」

---

### シーン1｜アラーム発火（オープニングのつかみ）

**日本語の意図**：朝焼けの寝室で、擬人化された目覚まし時計マスコットが震えながら鳴っている。ユーザー（シルエットまたは布団の膨らみ）がまだ布団の中で薄目を開ける瞬間。「起きた…？　それとも、まだ…？」の空気感。

**ショット設計**：ミディアムショットで寝室全体を見せてから、ゆっくり主観のズームインでアラーム時計へ寄る。カメラは終始固定気味（三脚に乗っているような安定感）。尺は5秒。

**プロンプト**：
```
[CHARACTER], with a sleepy half-closed-eyes expression and small floating "Z" doodles beside its face, vibrates and rings loudly on a wooden bedside table. Behind it, a cozy bedroom interior with a large window letting in warm morning light, a blanket-covered figure in the bed softly stirs and one corner of the blanket lifts slightly as if peeking out. Camera starts as a medium shot of the whole nightstand and bed, then performs a slow, smooth push-in zoom toward the alarm clock character's face over the duration of the shot.
[CHARACTER]
[STYLE]
```

**ネガティブプロンプト**：`[NEGATIVE]` に加えて `jump cuts, character leaving frame, second alarm clock character` を追加。

**KlingAI設定の目安**：Duration 5秒 / Zoom: 弱〜中（ゆっくり） / Pan: なし。

---

### シーン2｜二度寝申立書（入力のコミカルさ）

**日本語の意図**：法廷の書式をポップに崩した紙（申立書）が、木槌アイコンとともにふわっと差し出される。深刻さゼロの、ポップでコミカルな「提出」の仕草。

**ショット設計**：クローズアップ〜ミディアムショット。書類が画面中央に浮かび上がり、キャラクターの手（スタビーアーム）がそれを差し出す。カメラはごくわずかに右へパン。尺は4〜5秒。

**プロンプト**：
```
[CHARACTER] playfully holds up and presents a whimsical, colorful courtroom document titled "二度寝申立書" with a small gavel icon printed in the corner, using its short stubby arms. The paper has rounded pop-art style edges and pastel colors (soft yellow and coral), with small sparkle and confetti-like particle effects appearing around it as it's presented toward the camera. Comedic, lighthearted, theatrical presentation gesture. Camera holds a medium close-up shot with a very slight rightward pan as the document is raised.
[CHARACTER]
[STYLE]
```

**ネガティブプロンプト**：`[NEGATIVE]` に加えて `readable small text, legible document text, extra sheets of paper` を追加（文字を読ませようとすると崩れるため、「読める文字」自体をネガティブに入れて崩壊を防ぐ）。

**KlingAI設定の目安**：Duration 4〜5秒 / Pan: 弱 / Zoom: なし。

---

### シーン3｜開廷中（審理演出）

**日本語の意図**：法服を着た同じ時計マスコット（＝AI裁判官）が木槌をコンコンと鳴らす。背景に砂時計のモチーフが落ちていくプログレス表現。テンポよく、間延びしない。

**ショット設計**：ミディアムショット、正面〜やや見上げのアングルで裁判官としての威厳を少し演出。木槌が振り下ろされる瞬間にわずかなスローモーション。尺は5秒。

**プロンプト**：
```
[CHARACTER], now wearing a small oversized black judge's robe with gold trim and a tiny judge's cap, stands behind a wooden podium and comically bangs a small wooden gavel down twice with a satisfying "thud" motion. Beside the podium, a golden hourglass with sand steadily falling floats in the air, symbolizing a short deliberation in progress. Playful, mock-serious courtroom atmosphere. Camera is a static medium shot from a slightly low angle looking up at the character, with a subtle slow-motion emphasis on the gavel strikes.
[CHARACTER]
[STYLE]
```

**ネガティブプロンプト**：`[NEGATIVE]` に加えて `gavel disappearing, hourglass shattering, multiple judges` を追加。

**KlingAI設定の目安**：Duration 5秒 / Zoom・Pan: なし（固定気味） / Camera angle: low angle。

---

### シーン4｜判決の瞬間（★最優先・最大の見せ場）

**日本語の意図**：巻物／証書調のカードに、大きなハンコが「ドン」と押される演出。光のパーティクルが飛び散る、この動画の中で一番盛り上がる1カット。ここだけはグリーン（許可）とレッド（棄却）の2バリエーション生成する。最優先クリップなので、他シーンより多めにバリエーション生成して選ぶ。

**ショット設計**：クローズアップ。証書がフレーム中央に大きく配置され、画面外上方からハンコが振り下ろされる。インパクトの瞬間だけ短いスローモーション、直後に光の粒子が弾ける。尺は5〜6秒（インパクト→余韻まで見せたいので他シーンよりやや長め）。

**プロンプト（許可バージョン／グリーン基調）**：
```
A large ornate wooden stamp, held by [CHARACTER]'s stubby arm from off-screen above, slams down dramatically onto an unfurled scroll-like certificate card centered in frame, with a satisfying heavy impact. On impact, glowing green (#4CAF50) light particles and soft sparkles burst outward in all directions, and a warm golden rim light briefly flares around the card. Celebratory, triumphant, satisfying mood. Camera is a static close-up centered on the certificate, with a brief slow-motion moment exactly at the instant of impact before returning to normal speed for the particle burst.
[CHARACTER]
[STYLE]
```

**プロンプト（棄却バージョン／レッド基調）**：
```
A large ornate wooden stamp, held by [CHARACTER]'s stubby arm from off-screen above, slams down firmly onto an unfurled scroll-like certificate card centered in frame, with a solid decisive impact. On impact, glowing red (#E53935) light particles burst outward in all directions, and a firm reddish rim light briefly flares around the card. The mood is slightly more stern and final, but still stylized and comedic rather than scary. Camera is a static close-up centered on the certificate, with a brief slow-motion moment exactly at the instant of impact before returning to normal speed for the particle burst.
[CHARACTER]
[STYLE]
```

**ネガティブプロンプト**：`[NEGATIVE]` に加えて `stamp breaking the card, card tearing, multiple stamps, blood-like red color, aggressive or violent mood` を追加（棄却バージョンで「怖すぎる」方向に振れないためのガード）。

**KlingAI設定の目安**：Duration 5〜6秒 / Zoom・Pan: なし（固定） / この2本だけ試行回数を多めに（3〜5回生成して一番スタンプの物理的な説得力があるものを選ぶ）。

---

### シーン5a｜執行（許可時：時刻の後ろ倒し）

**日本語の意図**：時計の針、またはデジタル時刻の数字が、なめらかにスライドしながら後ろの時刻に変わっていく。予定リストの項目も一緒にずれていく。

**ショット設計**：ミディアムショット、時計とスケジュールリストを横並びで見せる俯瞰気味の構図。時刻が滑らかにモーフィングする様子をカメラは動かさずじっくり見せる。尺は5秒。

**プロンプト**：
```
A stylized round digital alarm clock display, matching [CHARACTER]'s color palette (cream-white body, gold trim), smoothly slides and morphs its glowing digital numbers forward in time (from an earlier time to a slightly later time), positioned beside a small floating schedule list card whose time labels gently shift and rearrange in sync with the clock, like gears quietly re-aligning. Warm, reassuring, orderly mood, no urgency. Camera is a static medium shot showing both the clock and the schedule list side by side, no camera movement.
[CHARACTER]
[STYLE]
```

**ネガティブプロンプト**：`[NEGATIVE]` に加えて `readable small text, legible schedule text, numbers becoming unreadable garbage` を追加。

**KlingAI設定の目安**：Duration 5秒 / Zoom・Pan: なし。

---

### シーン5b｜起床促し（棄却時：カウントダウン）

**日本語の意図**：中央に大きなカウントダウンタイマー。緊張感はあるが、コミカルさは失わない。

**ショット設計**：ミディアムショット。中央にタイマー、奥にキャラクターが伸びをして起き上がる。カメラはわずかに手前へ寄る程度。尺は5秒。

**プロンプト**：
```
A large stylized circular countdown timer with glowing digital numbers ticks down steadily, centered in the frame. Behind it, [CHARACTER] stands upright on the bedside table and stretches its stubby arms upward with an energetic, determined expression, no longer sleepy. Playful sense of urgency without fear or danger, comedic wake-up energy. Camera performs a very slow, subtle push-in toward the countdown timer.
[CHARACTER]
[STYLE]
```

**ネガティブプロンプト**：`[NEGATIVE]` に加えて `readable countdown digits, panic or distress expression, alarm siren visual` を追加。

**KlingAI設定の目安**：Duration 5秒 / Zoom: 弱（ゆっくり） / Pan: なし。

---

### シーン6｜人間ゲート（★最優先・オチ）

**日本語の意図**：これが思想の核。指（またはユーザーのシルエットの手）が大きなボタンを長押しし、プログレスバー/リングがじわじわ満ちていく。ここだけは他のシーンよりわずかに真剣なトーンに寄せる（コミカルさを少し抑える）。最優先クリップなので、シーン4同様に複数回生成して選ぶ。

**ショット設計**：エクストリームクローズアップ。指とボタンだけにフォーカスし、背景は浅い被写界深度でぼかす。プログレスリングが満ちていく様子をカメラは動かさずじっくり見せる。尺は5〜6秒（長押しの「間」を感じさせるため気持ち長め）。

**プロンプト**：
```
An extreme close-up of a human hand's finger firmly pressing and holding down a large round red button on a soft-glowing panel. A thin circular progress ring around the button slowly and steadily fills up with warm golden light as time passes, moving at a deliberate, unhurried pace. The background is softly blurred (shallow depth of field) but still shows a hint of the warm sunrise gradient bedroom setting. The mood shifts slightly more serious, calm, and deliberate compared to the earlier playful courtroom scenes — this is a quiet moment of personal resolve, not fear. Camera holds a completely static extreme close-up shot on the finger and button.
[CHARACTER]
[STYLE]
```

**ネガティブプロンプト**：`[NEGATIVE]` に加えて `button breaking, finger releasing early, comedic exaggerated expression, scary or threatening mood, multiple hands` を追加（ここだけは他シーンよりコミカルさを抑えたいので、その逸脱を防ぐ）。

**KlingAI設定の目安**：Duration 5〜6秒 / Zoom・Pan: なし（完全固定） / この2本（シーン4・6）は生成試行回数を優先的に割く。

---

## 3. 差し替え・運用メモ

- 生成した動画は `docs/presentation/pitch.md` のスライド4〜6の該当箇所（「※画面キャプチャ差し替え予定」の注記部分）に差し込む。実UIのスクリーンショットが用意できた場合は、実スクショ／実画面録画を優先し、KlingAI生成カットは世界観演出用の補完（オープニングや判決の瞬間の情緒的な後押し）として併用する
- シーン4（判決の瞬間）とシーン6（人間ゲート）は生成の試行回数・レビュー時間を優先的に割り当てる
- 生成物は `docs/presentation/assets/scene-N-用途名.mp4` として保存し、採用しなかったバリエーションも一旦残しておく（あとで差し替えたくなった場合に備える）
- **プロンプト投入時の注意**：各シーンのプロンプト本文中に出てくる `[CHARACTER]` と `[STYLE]` は、2.1のブロックの中身をそのまま展開して1つの長い英文プロンプトに結合してから投入する（KlingAIの入力欄にタグ名の文字列 `[CHARACTER]` をそのまま貼らない）。ネガティブプロンプト欄がある場合は「共通`[NEGATIVE]`＋シーン別追加分」を結合して入力する
