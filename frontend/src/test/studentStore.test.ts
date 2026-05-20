import { describe, expect, it } from 'vitest';
import { extractOcrText } from '../store/studentStore';

describe('extractOcrText', () => {
  it('reads legacy flat OCR response', () => {
    expect(extractOcrText({ text: '春天来了' })).toBe('春天来了');
  });

  it('reads backend nested OCR response', () => {
    expect(extractOcrText({ success: true, data: { text: '我的作文' } })).toBe('我的作文');
  });

  it('returns null when OCR response has no text', () => {
    expect(extractOcrText({ success: false, data: { error: '识别失败' } })).toBeNull();
    expect(extractOcrText({ success: true, data: { text: '   ' } })).toBeNull();
  });
});
