(() => {
  "use strict";

  const GREETING_TEXT = "起きた…？　それとも、まだ…？";
  const FALLBACK_DENIED_TEXT = "AI裁判所が応答しませんでした。即時起床とみなします。";
  const SICK_HOLD_MS = 3000;
  const POST_VERDICT_DELAY_MS = 1500;
  // Greeting playback can leak into the mic if recognition starts immediately.
  const POST_GREETING_LISTEN_DELAY_MS = 400;
  const SILENCE_WAV =
    "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

  const FALLBACK_DENIED = {
    verdict: "denied",
    minutes: 0,
    reason: FALLBACK_DENIED_TEXT,
    verdictText: FALLBACK_DENIED_TEXT,
  };

  const screens = {
    alarm: document.getElementById("screen-alarm"),
    listening: document.getElementById("screen-listening"),
    trial: document.getElementById("screen-trial"),
    verdict: document.getElementById("screen-verdict"),
    execute: document.getElementById("screen-execute"),
  };

  const btnPlead = document.getElementById("btn-plead");
  const listenStatus = document.getElementById("listen-status");
  const listenTranscript = document.getElementById("listen-transcript");
  const fallbackForm = document.getElementById("fallback-form");
  const noteFallback = document.getElementById("note-fallback");
  const btnSubmitFallback = document.getElementById("btn-submit-fallback");
  const verdictCard = document.getElementById("verdict-card");
  const verdictReason = document.getElementById("verdict-reason");
  const verdictAudio = document.getElementById("verdict-audio");
  const greetingAudio = document.getElementById("greeting-audio");
  const executeTitle = document.getElementById("execute-title");
  const executeDetail = document.getElementById("execute-detail");
  const btnSick = document.getElementById("btn-sick");
  const btnRestart = document.getElementById("btn-restart");

  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

  let sessionId = 0;
  let abortController = null;
  let currentSession = null;
  let flowStarted = false;
  let recognition = null;
  let recognitionActive = false;
  let acceptSpeech = false;
  let judging = false;
  let pendingTimers = new Set();
  let greetingObjectUrl = null;
  let verdictObjectUrl = null;

  let sickPressTimer = null;
  let sickPressing = false;
  let sickConfirmed = false;
  let deviceContext = null;

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function isCurrent(id) {
    return Boolean(currentSession) && id === sessionId && id === currentSession.id;
  }

  function beginSession() {
    sessionId += 1;
    if (abortController) abortController.abort();
    abortController = new AbortController();
    currentSession = { id: sessionId, signal: abortController.signal };
    return currentSession;
  }

  function wait(ms, id) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);
        resolve(isCurrent(id));
      }, ms);
      pendingTimers.add(timer);
    });
  }

  function clearPendingTimers() {
    pendingTimers.forEach((timer) => clearTimeout(timer));
    pendingTimers.clear();
  }

  function revokeUrl(url) {
    if (url) URL.revokeObjectURL(url);
  }

  function stopAudio(el) {
    try {
      el.pause();
      el.removeAttribute("src");
      el.load();
    } catch (err) {
      console.warn("[audio stop]", err);
    }
  }

  function armAudioElement(el) {
    // First-tap unlock so later /api/speak playback can autoplay after awaits.
    try {
      el.muted = true;
      el.src = SILENCE_WAV;
      const playPromise = el.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } catch (err) {
      console.warn("[audio unlock]", err);
    }
  }

  function stopRecognition() {
    acceptSpeech = false;
    recognitionActive = false;
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
      try {
        recognition.abort();
      } catch {
        // already stopped
      }
    }
  }

  function setListenStatus(text) {
    listenStatus.textContent = text;
  }

  function fallbackDeniedVerdict() {
    return { ...FALLBACK_DENIED };
  }

  function isAbortError(err) {
    return err?.name === "AbortError";
  }

  function normalizeVerdict(raw) {
    if (!raw || (raw.verdict !== "granted" && raw.verdict !== "denied")) {
      return fallbackDeniedVerdict();
    }
    const minutes = Number(raw.minutes);
    return {
      verdict: raw.verdict,
      minutes: Number.isFinite(minutes) ? minutes : 0,
      reason: raw.reason || FALLBACK_DENIED_TEXT,
      verdictText: raw.verdictText || raw.reason || FALLBACK_DENIED_TEXT,
    };
  }

  function formatAlarmTime(baseTimeStr, minutesFromNow) {
    const [h, m] = (baseTimeStr || "07:01").split(":").map(Number);
    const base = new Date(2000, 0, 1, h || 0, m || 0);
    const when = new Date(base.getTime() + Math.max(0, minutesFromNow) * 60 * 1000);
    const hh = String(when.getHours()).padStart(2, "0");
    const mm = String(when.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  async function fetchJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }
    if (!res.ok) {
      const message = data?.error || data?.detail || text || `HTTP ${res.status}`;
      throw new Error(message);
    }
    return data;
  }

  async function fetchContext(signal) {
    const data = await fetchJson("/api/context", { signal });
    console.log("[context]", data);
    deviceContext = data;
    return data;
  }

  async function fetchSpeakBlob(text, signal) {
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `speak HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errBody = await res.text();
      throw new Error(errBody || "speak returned JSON instead of audio");
    }

    return res.blob();
  }

  function playBlob(audioEl, blob, signal, urlSlot) {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }

      if (urlSlot === "greeting") {
        revokeUrl(greetingObjectUrl);
        greetingObjectUrl = null;
      } else {
        revokeUrl(verdictObjectUrl);
        verdictObjectUrl = null;
      }

      const objectUrl = URL.createObjectURL(blob);
      if (urlSlot === "greeting") greetingObjectUrl = objectUrl;
      else verdictObjectUrl = objectUrl;

      let settled = false;
      let watchdog = null;

      const finish = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (err) reject(err);
        else resolve();
      };

      const onEnded = () => finish(null);
      const onError = () => finish(new Error("audio playback failed"));
      const onAbort = () => {
        try {
          audioEl.pause();
        } catch {
          // ignore
        }
        finish(new DOMException("Aborted", "AbortError"));
      };

      const cleanup = () => {
        audioEl.removeEventListener("ended", onEnded);
        audioEl.removeEventListener("error", onError);
        signal.removeEventListener("abort", onAbort);
        if (watchdog) clearTimeout(watchdog);
      };

      const armWatchdog = (ms) => {
        if (watchdog) clearTimeout(watchdog);
        watchdog = setTimeout(() => finish(null), ms);
      };

      audioEl.addEventListener("ended", onEnded);
      audioEl.addEventListener("error", onError);
      signal.addEventListener("abort", onAbort);

      try {
        audioEl.pause();
      } catch {
        // ignore
      }
      audioEl.muted = false;
      audioEl.src = objectUrl;
      audioEl.load();

      const playPromise = audioEl.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch((err) => finish(err || new Error("audio play() rejected")));
      }

      armWatchdog(60000);
      audioEl.addEventListener(
        "loadedmetadata",
        () => {
          const durationMs = Number(audioEl.duration) * 1000;
          if (Number.isFinite(durationMs) && durationMs > 0) {
            armWatchdog(durationMs + 1000);
          }
        },
        { once: true }
      );
    });
  }

  async function speakAndPlay(text, audioEl, session, urlSlot) {
    const blob = await fetchSpeakBlob(text, session.signal);
    if (!isCurrent(session.id)) throw new DOMException("Aborted", "AbortError");
    await playBlob(audioEl, blob, session.signal, urlSlot);
  }

  function showFallbackForm(statusText) {
    fallbackForm.hidden = false;
    if (statusText) setListenStatus(statusText);
  }

  function hideFallbackForm() {
    fallbackForm.hidden = true;
  }

  function ensureRecognition() {
    if (recognition || !SpeechRecognitionCtor) return recognition;

    recognition = new SpeechRecognitionCtor();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.addEventListener("result", (event) => {
      if (!acceptSpeech || judging || !screens.listening.classList.contains("active")) return;

      let interim = "";
      let finalText = "";
      for (let i = 0; i < event.results.length; i += 1) {
        const piece = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }

      const displayed = (finalText || interim).trim();
      if (displayed) listenTranscript.textContent = displayed;

      const confirmed = finalText.trim();
      if (confirmed) {
        stopRecognition();
        void submitTranscript(confirmed);
      }
    });

    recognition.addEventListener("error", (event) => {
      recognitionActive = false;
      const error = event.error;
      console.warn("[speech] error", error);

      if (!acceptSpeech || judging || !screens.listening.classList.contains("active")) return;

      if (error === "no-speech" || error === "aborted") return;

      if (error === "not-allowed" || error === "service-not-allowed" || error === "audio-capture") {
        acceptSpeech = false;
        showFallbackForm("マイクが使えません。かわりに入力してください。");
        return;
      }

      setListenStatus(`音声認識エラー（${error}）。もう一度話してください…`);
    });

    recognition.addEventListener("end", () => {
      recognitionActive = false;
      if (!acceptSpeech || judging || !screens.listening.classList.contains("active")) return;
      if (!fallbackForm.hidden) return;

      setListenStatus("もう一度お願いします。聞いています…");
      setTimeout(() => {
        if (!acceptSpeech || judging) return;
        tryStartRecognition();
      }, 250);
    });

    return recognition;
  }

  function tryStartRecognition() {
    if (!recognition || judging || !acceptSpeech) return;
    try {
      recognition.start();
      recognitionActive = true;
    } catch (err) {
      console.warn("[speech] start failed", err);
      if (!acceptSpeech || judging) return;
      setTimeout(() => {
        if (!acceptSpeech || judging || recognitionActive) return;
        try {
          recognition.start();
          recognitionActive = true;
        } catch (retryErr) {
          console.warn("[speech] retry failed", retryErr);
          acceptSpeech = false;
          showFallbackForm("音声入力を開始できませんでした。かわりに入力してください。");
        }
      }, 300);
    }
  }

  function startWebSpeech() {
    if (!SpeechRecognitionCtor) {
      showFallbackForm("このブラウザは音声入力に対応していません。入力してください。");
      return;
    }

    ensureRecognition();
    hideFallbackForm();
    acceptSpeech = true;
    setListenStatus("聞いています…");
    tryStartRecognition();
  }

  async function startListening(session) {
    if (!isCurrent(session.id) || judging) return;
    if (!screens.listening.classList.contains("active")) return;

    const stillCurrent = await wait(POST_GREETING_LISTEN_DELAY_MS, session.id);
    if (!stillCurrent || judging) return;
    if (!screens.listening.classList.contains("active")) return;

    startWebSpeech();
  }

  async function submitTranscript(transcript) {
    const session = currentSession;
    if (!session || judging || !isCurrent(session.id)) return;

    judging = true;
    acceptSpeech = false;
    stopRecognition();
    stopAudio(greetingAudio);

    showScreen("trial");

    let verdict;
    try {
      const raw = await fetchJson("/api/judge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript }),
        signal: session.signal,
      });
      verdict = normalizeVerdict(raw);
    } catch (err) {
      if (isAbortError(err) || !isCurrent(session.id)) return;
      console.error("[judge]", err);
      verdict = fallbackDeniedVerdict();
    }

    if (!isCurrent(session.id)) return;
    await presentVerdict(verdict, session);
  }

  async function presentVerdict(verdict, session) {
    showScreen("verdict");

    verdictCard.classList.remove("granted", "denied");
    verdictCard.classList.add(verdict.verdict === "granted" ? "granted" : "denied");
    verdictReason.textContent = verdict.verdictText || verdict.reason || FALLBACK_DENIED_TEXT;

    const spokenText = verdict.verdictText || verdict.reason || FALLBACK_DENIED_TEXT;
    try {
      await speakAndPlay(spokenText, verdictAudio, session, "verdict");
    } catch (err) {
      if (isAbortError(err) || !isCurrent(session.id)) return;
      console.warn("[speak verdict] failed", err);
    }

    const stillCurrent = await wait(POST_VERDICT_DELAY_MS, session.id);
    if (!stillCurrent) return;
    renderExecute(verdict);
  }

  function renderExecute(verdict) {
    showScreen("execute");

    if (verdict.verdict === "granted") {
      const minutes = verdict.minutes || 0;
      const alarmTime = formatAlarmTime(deviceContext?.now, minutes);
      executeTitle.textContent = `${minutes}分後、必ず起こしますからね`;
      executeDetail.textContent = `次のアラーム: ${alarmTime}`;
    } else {
      executeTitle.textContent = "判決は判決。さあ、布団から出よ。";
      executeDetail.textContent = verdict.reason || FALLBACK_DENIED_TEXT;
    }
  }

  async function startFlow() {
    if (flowStarted) return;
    flowStarted = true;

    const session = beginSession();
    judging = false;
    acceptSpeech = false;
    hideFallbackForm();
    listenTranscript.textContent = "";
    setListenStatus("AIが話しかけています…");

    armAudioElement(greetingAudio);
    armAudioElement(verdictAudio);
    showScreen("listening");

    if (!SpeechRecognitionCtor) {
      showFallbackForm("このブラウザは音声入力に対応していません。入力してください。");
    }

    try {
      await fetchContext(session.signal);
    } catch (err) {
      if (isAbortError(err) || !isCurrent(session.id)) return;
      console.warn("[context] failed", err);
    }

    try {
      await speakAndPlay(GREETING_TEXT, greetingAudio, session, "greeting");
    } catch (err) {
      if (isAbortError(err) || !isCurrent(session.id)) return;
      console.warn("[speak greeting] failed", err);
    }

    if (!isCurrent(session.id) || judging) return;
    await startListening(session);
  }

  function resetSickButton() {
    sickPressing = false;
    sickConfirmed = false;
    if (sickPressTimer) {
      clearTimeout(sickPressTimer);
      sickPressTimer = null;
    }
    btnSick.disabled = false;
    btnSick.textContent = "本日は休む（3秒長押しで承認）";
  }

  function startSickPress(event) {
    if (sickConfirmed || btnSick.disabled) return;
    if (event.type === "mousedown" && event.button !== 0) return;
    if (sickPressing) return;
    if (event.type === "touchstart") event.preventDefault();

    sickPressing = true;
    btnSick.textContent = "長押し中…";
    sickPressTimer = setTimeout(() => {
      sickPressTimer = null;
      sickPressing = false;
      sickConfirmed = true;
      btnSick.textContent = "本日は休みます（承認済み）";
      btnSick.disabled = true;
    }, SICK_HOLD_MS);
  }

  function cancelSickPress() {
    if (!sickPressing || sickConfirmed) return;
    sickPressing = false;
    if (sickPressTimer) {
      clearTimeout(sickPressTimer);
      sickPressTimer = null;
    }
    btnSick.textContent = "本日は休む（3秒長押しで承認）";
  }

  function resetDemo() {
    flowStarted = false;
    judging = false;
    acceptSpeech = false;
    stopRecognition();
    clearPendingTimers();
    if (abortController) abortController.abort();
    abortController = null;
    currentSession = null;
    sessionId += 1;

    stopAudio(greetingAudio);
    stopAudio(verdictAudio);
    revokeUrl(greetingObjectUrl);
    revokeUrl(verdictObjectUrl);
    greetingObjectUrl = null;
    verdictObjectUrl = null;

    listenTranscript.textContent = "";
    setListenStatus("聞いています…");
    hideFallbackForm();
    noteFallback.value = "";
    verdictReason.textContent = "";
    verdictCard.classList.remove("granted", "denied");
    executeTitle.textContent = "";
    executeDetail.textContent = "";
    resetSickButton();
    showScreen("alarm");
  }

  btnPlead.addEventListener("click", () => {
    void startFlow();
  });

  btnSubmitFallback.addEventListener("click", () => {
    if (fallbackForm.hidden || !screens.listening.classList.contains("active")) return;
    const transcript = (noteFallback.value || "").trim();
    void submitTranscript(transcript);
  });

  btnSick.addEventListener("mousedown", startSickPress);
  btnSick.addEventListener("touchstart", startSickPress, { passive: false });
  btnSick.addEventListener("mouseup", cancelSickPress);
  btnSick.addEventListener("mouseleave", cancelSickPress);
  btnSick.addEventListener("touchend", cancelSickPress);
  btnSick.addEventListener("touchcancel", cancelSickPress);
  btnSick.addEventListener("click", (event) => {
    event.preventDefault();
  });
  btnSick.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  btnRestart.addEventListener("click", () => {
    resetDemo();
  });
})();
