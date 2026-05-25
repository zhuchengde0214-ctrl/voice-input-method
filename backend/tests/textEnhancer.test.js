const {
  enhance,
  removeFillers,
  normalizeSpokenDigits,
  applyPunctuationKeywords,
  applyHotwords,
  autoPunctuate,
} = require('../src/services/textEnhancer');

describe('textEnhancer', () => {
  describe('removeFillers', () => {
    it('removes Chinese filler words', () => {
      expect(removeFillers('嗯那个我觉得这个事情')).toBe('我觉得事情');
    });
    it('removes English filler words case-insensitively', () => {
      expect(removeFillers('Um you know like this')).toBe('this');
    });
    it('preserves text when no fillers are present', () => {
      expect(removeFillers('今天天气很好')).toBe('今天天气很好');
    });
  });

  describe('normalizeSpokenDigits', () => {
    it('converts a multi-digit Chinese run to Arabic numerals', () => {
      expect(normalizeSpokenDigits('二零二六年')).toBe('2026年');
    });
    it('preserves single digit characters used as words', () => {
      expect(normalizeSpokenDigits('一个苹果')).toBe('一个苹果');
    });
    it('handles "两" as 2 in a digit run', () => {
      expect(normalizeSpokenDigits('两三个')).toBe('23个');
    });
  });

  describe('applyPunctuationKeywords', () => {
    it('replaces punctuation keywords with the corresponding mark', () => {
      expect(applyPunctuationKeywords('你好逗号世界句号')).toBe('你好，世界。');
    });
  });

  describe('applyHotwords', () => {
    it('replaces aliases with the canonical term', () => {
      const out = applyHotwords('我们使用 K8S 部署', [{ term: 'Kubernetes', aliases: ['K8S', 'k8s'] }]);
      expect(out).toBe('我们使用 Kubernetes 部署');
    });
    it('returns input unchanged when hotword list is empty', () => {
      expect(applyHotwords('hello', [])).toBe('hello');
    });
    it('ignores malformed entries safely', () => {
      expect(applyHotwords('hello', [null, { aliases: ['x'] }])).toBe('hello');
    });
  });

  describe('autoPunctuate', () => {
    it('appends a Chinese period when text ends without terminal punctuation', () => {
      expect(autoPunctuate('今天天气很好')).toBe('今天天气很好。');
    });
    it('appends a period for English text', () => {
      expect(autoPunctuate('hello world')).toBe('hello world.');
    });
    it('leaves text alone if it already ends with terminal punctuation', () => {
      expect(autoPunctuate('已经有句号了。')).toBe('已经有句号了。');
    });
    it('returns empty for empty/whitespace input', () => {
      expect(autoPunctuate('   ')).toBe('');
    });
  });

  describe('enhance (integration)', () => {
    it('runs the full pipeline end-to-end', () => {
      const out = enhance('嗯今天是二零二六年逗号天气真好');
      expect(out).toBe('今天是2026年，天气真好。');
    });
    it('respects feature flags', () => {
      const out = enhance('嗯今天天气好', {
        removeFillers: false,
        autoPunctuation: false,
      });
      expect(out).toBe('嗯今天天气好');
    });
    it('applies hotwords before punctuation', () => {
      const out = enhance('用 k8s 部署', { hotwords: [{ term: 'Kubernetes', aliases: ['k8s'] }] });
      expect(out).toBe('用 Kubernetes 部署。');
    });
    it('throws a 400-shaped error when text is not a string', () => {
      expect(() => enhance(null)).toThrow('text must be a string');
    });
  });
});
