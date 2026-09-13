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

## 2. ユーザーストーリー（シーン台本 / KlingAIプロンプト集）

各シーンは「日本語での意図」→「KlingAIに投げる英語プロンプト（そのまま貼り付け可能）」の順で記載。プロンプト末尾の `[STYLE]` は1.4のスタイルガイドを毎回同じ文言で付与するための共通ブロック。

**共通スタイルタグ（`[STYLE]`、全プロンプトの末尾に必ず付ける）**：
```
warm pastel sunrise gradient (orange to purple), playful colorful 3D-animated illustration style, cozy and comedic courtroom-meets-bedroom aesthetic, soft cinematic lighting, gentle slow camera movement, no on-screen text, no subtitles
```

### シーン1｜アラーム発火（オープニングのつかみ）

**日本語の意図**：朝焼けの寝室で、擬人化された目覚まし時計マスコットが震えながら鳴っている。ユーザー（シルエットまたは布団の膨らみ）がまだ布団の中で薄目を開ける瞬間。「起きた…？　それとも、まだ…？」の空気感。

**プロンプト**：
```
A cute anthropomorphic alarm clock character with a sleepy face vibrates and rings on a bedside table in a cozy bedroom bathed in warm sunrise light coming through the window. A blanket-covered figure stirs slightly, one eye peeking open. Gentle slow zoom-in on the alarm clock character.
[STYLE]
```

### シーン2｜二度寝申立書（入力のコミカルさ）

**日本語の意図**：法廷の書式をポップに崩した紙（申立書）が、木槌アイコンとともにふわっと差し出される。深刻さゼロの、ポップでコミカルな「提出」の仕草。

**プロンプト**：
```
A whimsical colorful courtroom document titled with a gavel icon floats and is playfully handed over by the sleepy alarm clock character, comedic and lighthearted mood, small sparkle effects around the paper as it's submitted.
[STYLE]
```

### シーン3｜開廷中（審理演出）

**日本語の意図**：法服を着た同じ時計マスコット（＝AI裁判官）が木槌をコンコンと鳴らす。背景に砂時計のモチーフが落ちていくプログレス表現。テンポよく、間延びしない。

**プロンプト**：
```
The same alarm clock character, now wearing a small judge's robe, comically bangs a tiny gavel on a podium. An hourglass motif with falling golden sand appears beside it, symbolizing a short deliberation. Playful courtroom atmosphere.
[STYLE]
```

### シーン4｜判決の瞬間（★最優先・最大の見せ場）

**日本語の意図**：巻物／証書調のカードに、大きなハンコが「ドン」と押される演出。光のパーティクルが飛び散る、この動画の中で一番盛り上がる1カット。ここだけはグリーン（許可）とレッド（棄却）の2バリエーション生成する。

**プロンプト（許可バージョン／グリーン基調）**：
```
A large ornate stamp slams down dramatically onto a scroll-like certificate card with a satisfying impact, glowing green light particles burst outward on impact, celebratory and triumphant mood, slight slow motion on the stamp impact.
[STYLE]
```

**プロンプト（棄却バージョン／レッド基調）**：
```
A large ornate stamp slams down firmly onto a scroll-like certificate card, glowing red light particles burst outward on impact, a slightly stern but still comedic mood, slight slow motion on the stamp impact.
[STYLE]
```

### シーン5a｜執行（許可時：時刻の後ろ倒し）

**日本語の意図**：時計の針、またはデジタル時刻の数字が、なめらかにスライドしながら後ろの時刻に変わっていく。予定リストの項目も一緒にずれていく。

**プロンプト**：
```
A digital clock display smoothly slides and morphs its numbers forward in time, with a small schedule list beside it whose time labels gently shift and rearrange in sync, warm and reassuring mood.
[STYLE]
```

### シーン5b｜起床促し（棄却時：カウントダウン）

**日本語の意図**：中央に大きなカウントダウンタイマー。緊張感はあるが、コミカルさは失わない。

**プロンプト**：
```
A large playful countdown timer ticks down in the center of the frame, the sleepy alarm clock character now standing upright and stretching, energetic wake-up mood, comedic urgency.
[STYLE]
```

### シーン6｜人間ゲート（★最優先・オチ）

**日本語の意図**：これが思想の核。指（またはユーザーのシルエットの手）が大きなボタンを長押しし、プログレスバー/リングがじわじわ満ちていく。ここだけは他のシーンよりわずかに真剣なトーンに寄せる（コミカルさを少し抑える）。

**プロンプト**：
```
A close-up of a finger firmly pressing and holding down a large red button, a circular progress ring slowly fills up around the button as time passes, the mood shifts slightly more serious and deliberate compared to the playful courtroom scenes, warm sunrise light still present in the background.
[STYLE]
```

---

## 3. 差し替え・運用メモ

- 生成した動画は `docs/presentation/pitch.md` のスライド4〜6の該当箇所（「※画面キャプチャ差し替え予定」の注記部分）に差し込む。実UIのスクリーンショットが用意できた場合は、実スクショ／実画面録画を優先し、KlingAI生成カットは世界観演出用の補完（オープニングや判決の瞬間の情緒的な後押し）として併用する
- シーン4（判決の瞬間）とシーン6（人間ゲート）は生成の試行回数・レビュー時間を優先的に割り当てる
- 生成物は `docs/presentation/assets/scene-N-用途名.mp4` として保存し、採用しなかったバリエーションも一旦残しておく（あとで差し替えたくなった場合に備える）
