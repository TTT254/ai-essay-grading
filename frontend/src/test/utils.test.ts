import { describe, it, expect } from 'vitest';

// Score color logic — mirrors the logic used in Report.tsx
function getScoreColor(score: number): string {
  if (score >= 85) return 'green';
  if (score >= 70) return 'blue';
  if (score >= 60) return 'orange';
  return 'red';
}

describe('Score color utility', () => {
  it('returns green for score >= 85', () => {
    expect(getScoreColor(85)).toBe('green');
    expect(getScoreColor(100)).toBe('green');
  });

  it('returns blue for score 70-84', () => {
    expect(getScoreColor(70)).toBe('blue');
    expect(getScoreColor(84)).toBe('blue');
  });

  it('returns orange for score 60-69', () => {
    expect(getScoreColor(60)).toBe('orange');
    expect(getScoreColor(69)).toBe('orange');
  });

  it('returns red for score < 60', () => {
    expect(getScoreColor(59)).toBe('red');
    expect(getScoreColor(0)).toBe('red');
  });
});

// Word count — strips whitespace and counts characters (Chinese essay style)
function countWords(text: string): number {
  return text.replace(/\s+/g, '').length;
}

describe('Word count utility', () => {
  it('counts Chinese characters correctly', () => {
    expect(countWords('你好世界')).toBe(4);
    expect(countWords('  你 好  ')).toBe(2);
  });

  it('handles empty string', () => {
    expect(countWords('')).toBe(0);
  });

  it('counts mixed Chinese and English', () => {
    expect(countWords('Hello世界')).toBe(7);
  });
});
