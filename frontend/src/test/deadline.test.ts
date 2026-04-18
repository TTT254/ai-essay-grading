import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';

function getDeadlineStatus(deadline: string): 'overdue' | 'urgent' | 'normal' {
  const now = dayjs();
  const end = dayjs(deadline);
  const diff = end.diff(now, 'day');
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'urgent';
  return 'normal';
}

describe('Deadline status', () => {
  it('returns overdue for past dates', () => {
    expect(getDeadlineStatus('2020-01-01')).toBe('overdue');
  });

  it('returns urgent for dates within 3 days', () => {
    const soon = dayjs().add(2, 'day').format('YYYY-MM-DD');
    expect(getDeadlineStatus(soon)).toBe('urgent');
  });

  it('returns normal for future dates beyond 3 days', () => {
    const future = dayjs().add(10, 'day').format('YYYY-MM-DD');
    expect(getDeadlineStatus(future)).toBe('normal');
  });

  it('returns urgent for today (diff = 0)', () => {
    const today = dayjs().format('YYYY-MM-DD');
    expect(getDeadlineStatus(today)).toBe('urgent');
  });

  it('returns urgent for exactly 3 days out', () => {
    const threeDays = dayjs().add(3, 'day').format('YYYY-MM-DD');
    expect(getDeadlineStatus(threeDays)).toBe('urgent');
  });
});
