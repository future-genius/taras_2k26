import { useState, useEffect } from 'react';

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

// 10 October 2026, 09:00 AM IST (UTC+5:30) => UTC 2026-10-10 03:30:00
const DEFAULT_TARGET_TIMESTAMP = Date.UTC(2026, 9, 10, 3, 30, 0);

const parseTargetTime = (targetInput?: string | number | Date): number => {
  if (typeof targetInput === 'number') return targetInput;
  if (targetInput instanceof Date) return targetInput.getTime();
  if (typeof targetInput === 'string' && targetInput.trim()) {
    const parsed = new Date(targetInput).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return DEFAULT_TARGET_TIMESTAMP;
};

export const useCountdown = (
  targetDateInput: string | number | Date = '2026-10-10T09:00:00+05:30'
): CountdownTime => {
  const targetTime = parseTargetTime(targetDateInput);

  const calculateTimeLeft = (): CountdownTime => {
    const now = Date.now();
    const difference = targetTime - now;

    if (difference <= 0 || isNaN(difference)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isLive: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<CountdownTime>(() => calculateTimeLeft());

  useEffect(() => {
    const initialLeft = calculateTimeLeft();
    setTimeLeft(initialLeft);

    if (initialLeft.isLive) return;

    const timer = setInterval(() => {
      const currentLeft = calculateTimeLeft();
      setTimeLeft(currentLeft);
      if (currentLeft.isLive) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  return timeLeft;
};

