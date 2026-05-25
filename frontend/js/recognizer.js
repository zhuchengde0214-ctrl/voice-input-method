// Wraps the browser's SpeechRecognition API into a small EventTarget so the
// rest of the app stays free of vendor prefixes and lifecycle quirks.
// Emits: 'start', 'end', 'interim', 'final', 'error'.

export class Recognizer extends EventTarget {
  constructor() {
    super();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.supported = false;
      return;
    }
    this.supported = true;
    this.lang = 'zh-CN';
    this.recognition = null;
    this.shouldRestart = false;
    this.startedAt = 0;
    this.firstResultAt = 0;
  }

  setLang(lang) {
    this.lang = lang;
    if (this.recognition) this.recognition.lang = lang;
  }

  start() {
    if (!this.supported) {
      this._emit('error', { message: '当前浏览器不支持 Web Speech API，请使用 Chrome 或 Edge。' });
      return;
    }
    if (this.recognition) this.stop();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = this.lang;
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;
    this.startedAt = performance.now();
    this.firstResultAt = 0;

    r.onstart = () => this._emit('start');
    r.onerror = (e) => this._emit('error', { message: e.error || 'recognition_error' });
    r.onend = () => {
      this._emit('end');
      // Some Chromium builds end the session after long pauses. Auto-restart
      // if the user is still in "recording" mode.
      if (this.shouldRestart) {
        try { r.start(); } catch { /* already started */ }
      }
    };
    r.onresult = (event) => {
      if (!this.firstResultAt) {
        this.firstResultAt = performance.now();
        this._emit('latency', { ms: Math.round(this.firstResultAt - this.startedAt) });
      }
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;
        if (res.isFinal) finalText += text;
        else interim += text;
      }
      if (interim) this._emit('interim', { text: interim });
      if (finalText) this._emit('final', { text: finalText });
    };
    this.recognition = r;
    this.shouldRestart = true;
    try { r.start(); } catch (err) {
      this._emit('error', { message: err.message || String(err) });
    }
  }

  stop() {
    this.shouldRestart = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
  }

  _emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
