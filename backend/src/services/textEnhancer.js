// Server-side text enhancement: removes filler words, normalizes spoken numbers,
// and adds basic punctuation. Designed to be deterministic & dependency-free so
// it can run anywhere Node runs and remains cheap on CPU.

const FILLER_WORDS = [
  '嗯', '呃', '啊', '那个', '这个', '就是说', '然后呢', '对吧',
  'um', 'uh', 'er', 'like', 'you know',
];

const CN_DIGITS = {
  零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

const PUNCTUATION_KEYWORDS = {
  逗号: '，', 句号: '。', 问号: '？', 感叹号: '！',
  顿号: '、', 冒号: '：', 分号: '；',
};

function removeFillers(text) {
  let out = text;
  for (const w of FILLER_WORDS) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // English fillers are short and risk swallowing substrings inside real
    // words (e.g. "er" inside "Kubernetes"). Anchor them on word boundaries.
    // CJK fillers have no word-boundary concept, so we keep substring match.
    const isAscii = /^[\x00-\x7F]+$/.test(w);
    const pattern = isAscii ? `\\b${escaped}\\b` : escaped;
    out = out.replace(new RegExp(pattern, 'gi'), '');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

function normalizeSpokenDigits(text) {
  // Convert runs of consecutive Chinese digit characters (length >= 2) to Arabic numerals.
  // "二零二六年" -> "2026年". Single digits like "一个" are intentionally preserved.
  return text.replace(/[零一二两三四五六七八九]{2,}/g, (match) => {
    return match.split('').map((c) => CN_DIGITS[c]).join('');
  });
}

function applyPunctuationKeywords(text) {
  let out = text;
  for (const [word, mark] of Object.entries(PUNCTUATION_KEYWORDS)) {
    out = out.replace(new RegExp(word, 'g'), mark);
  }
  return out;
}

function autoPunctuate(text) {
  // Heuristic: if the text has no terminal punctuation and is reasonably long,
  // append a period. We avoid more aggressive splitting to prevent false breaks.
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  const lastChar = trimmed.slice(-1);
  const terminals = ['。', '？', '！', '.', '?', '!', '，', ',', '：', ':'];
  if (terminals.includes(lastChar)) return trimmed;
  const hasChinese = /[一-龥]/.test(trimmed);
  return trimmed + (hasChinese ? '。' : '.');
}

function applyHotwords(text, hotwords = []) {
  // Hotwords let the user correct frequently-misrecognized terms.
  // Each hotword has { term, aliases?: string[] } — every alias becomes the canonical term.
  let out = text;
  for (const hw of hotwords) {
    if (!hw || !hw.term) continue;
    const aliases = Array.isArray(hw.aliases) ? hw.aliases : [];
    for (const alias of aliases) {
      if (!alias) continue;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(escaped, 'gi'), hw.term);
    }
  }
  return out;
}

function enhance(rawText, options = {}) {
  if (typeof rawText !== 'string') {
    throw Object.assign(new Error('text must be a string'), { status: 400 });
  }
  const {
    removeFillers: optRemoveFillers = true,
    normalizeNumbers = true,
    autoPunctuation = true,
    hotwords = [],
  } = options;

  let out = rawText;
  out = applyHotwords(out, hotwords);
  out = applyPunctuationKeywords(out);
  if (optRemoveFillers) out = removeFillers(out);
  if (normalizeNumbers) out = normalizeSpokenDigits(out);
  if (autoPunctuation) out = autoPunctuate(out);
  return out;
}

module.exports = {
  enhance,
  removeFillers,
  normalizeSpokenDigits,
  applyPunctuationKeywords,
  applyHotwords,
  autoPunctuate,
  FILLER_WORDS,
};
