const { parse } = require('../src/services/commandParser');

describe('commandParser.parse', () => {
  it('returns BACKSPACE for "删除"', () => {
    expect(parse('删除')).toEqual({ action: 'BACKSPACE', matched: '删除' });
  });
  it('returns NEWLINE for "换行" with trailing punctuation', () => {
    expect(parse('换行。')).toEqual({ action: 'NEWLINE', matched: '换行' });
  });
  it('returns CLEAR for "clear all" case-insensitively', () => {
    expect(parse('Clear All')).toEqual({ action: 'CLEAR', matched: 'clear all' });
  });
  it('returns null when input is not a recognized command', () => {
    expect(parse('今天天气真好')).toBeNull();
  });
  it('returns null for empty / non-string input', () => {
    expect(parse('')).toBeNull();
    expect(parse(null)).toBeNull();
    expect(parse(undefined)).toBeNull();
  });
});
