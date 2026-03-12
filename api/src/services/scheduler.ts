export type ScheduleConfig = {
  postsPerDay: number;
  minIntervalHours: number;
  preferredHoursStart: number;
  preferredHoursEnd: number;
};

export function computeNextScheduledAt(config: ScheduleConfig, completedAt: Date): Date {
  const { postsPerDay, minIntervalHours, preferredHoursStart, preferredHoursEnd } = config;

  // Base interval in hours
  const baseIntervalHours = 24 / postsPerDay;

  // Apply ±10% random jitter
  const jitterFactor = 0.9 + Math.random() * 0.2;
  let intervalHours = baseIntervalHours * jitterFactor;

  // Floor at minIntervalHours
  if (intervalHours < minIntervalHours) {
    intervalHours = minIntervalHours;
  }

  const next = new Date(completedAt.getTime() + intervalHours * 60 * 60 * 1000);

  // No window constraint if start=0 and end=24
  if (preferredHoursStart === 0 && preferredHoursEnd === 24) {
    return next;
  }

  const windowSize = preferredHoursEnd - preferredHoursStart;

  // If window too narrow (less than minIntervalHours), we need to handle carefully
  if (windowSize <= 0) {
    // Invalid window — skip to next day's window start
    return advanceToWindowStart(next, preferredHoursStart, 1);
  }

  const nextHour = next.getUTCHours() + next.getUTCMinutes() / 60;

  if (nextHour >= preferredHoursStart && nextHour < preferredHoursEnd) {
    // Already within the preferred window
    return next;
  }

  if (nextHour < preferredHoursStart) {
    // Before window — advance to window start same day
    return setUtcHour(next, preferredHoursStart);
  }

  // After window — skip to next day's window start
  return advanceToWindowStart(next, preferredHoursStart, 1);
}

function setUtcHour(date: Date, hour: number): Date {
  const result = new Date(date);
  result.setUTCHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
  return result;
}

function advanceToWindowStart(date: Date, windowStartHour: number, daysToAdd: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + daysToAdd);
  result.setUTCHours(Math.floor(windowStartHour), Math.round((windowStartHour % 1) * 60), 0, 0);
  return result;
}
