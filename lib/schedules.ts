export type TimeRange = {
  start: number;
  end: number;
};

export function isValidTimeRange({ start, end }: TimeRange) {
  return Number.isFinite(start) && Number.isFinite(end) && end > start;
}

export function hasTimeConflict(candidate: TimeRange, existing: TimeRange[]) {
  return existing.some((item) => candidate.start < item.end && candidate.end > item.start);
}

export function normalizeRequiredText(value: string) {
  return value.trim();
}

export function isValidCategoryName(
  name: string,
  existingNames: string[],
  maxLength = 50,
) {
  const normalizedName = normalizeRequiredText(name);
  if (!normalizedName || normalizedName.length > maxLength) return false;
  const normalizedExistingNames = existingNames.map((item) => item.trim());
  return !normalizedExistingNames.includes(normalizedName);
}

export function isValidHexColor(color: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function isValidDuration(durationHours: number, availableHoursPerDay = 24) {
  return Number.isFinite(durationHours)
    && durationHours > 0
    && durationHours <= availableHoursPerDay;
}

export function findAvailableRanges(
  busyRanges: TimeRange[],
  window: TimeRange,
  durationHours: number,
) {
  if (!isValidTimeRange(window) || !isValidDuration(durationHours, window.end - window.start)) {
    return [];
  }

  const sortedBusyRanges = busyRanges
    .filter((range) => isValidTimeRange(range))
    .map((range) => ({
      start: Math.max(window.start, range.start),
      end: Math.min(window.end, range.end),
    }))
    .filter((range) => range.end > range.start)
    .sort((left, right) => left.start - right.start);

  const availableRanges: TimeRange[] = [];
  let cursor = window.start;

  for (const busyRange of sortedBusyRanges) {
    if (busyRange.start > cursor) {
      availableRanges.push({ start: cursor, end: busyRange.start });
    }
    cursor = Math.max(cursor, busyRange.end);
  }

  if (cursor < window.end) {
    availableRanges.push({ start: cursor, end: window.end });
  }

  return availableRanges.filter((range) => range.end - range.start >= durationHours);
}

export type PrivateSchedule = {
  id: string;
  title: string;
  category: string;
  notes?: string;
  publicToGroup?: boolean;
};

export function viewScheduleForMember(
  schedule: PrivateSchedule,
  viewerId: string,
  ownerId: string,
  memberIds: string[],
) {
  if (!memberIds.includes(viewerId)) {
    return null;
  }

  if (viewerId === ownerId || schedule.publicToGroup) {
    return {
      id: schedule.id,
      title: schedule.title,
      category: schedule.category,
      notes: schedule.notes,
    };
  }

  return {
    id: schedule.id,
    title: "忙碌中",
    category: "忙碌中",
  };
}

export function validateEventInput(title: string, range: TimeRange) {
  if (!normalizeRequiredText(title)) {
    throw new Error("請輸入標題");
  }
  if (!isValidTimeRange(range)) {
    throw new Error("結束時間必須晚於開始時間");
  }
  return { title: normalizeRequiredText(title), range };
}

export type ProposalItem = TimeRange & {
  title: string;
  category: string;
  day: number;
};

export function commitConfirmedProposals(
  existingItems: ProposalItem[],
  proposals: ProposalItem[],
) {
  const acceptedKeys = new Set(
    existingItems.map((item) =>
      `${item.title}|${item.category}|${item.day}|${item.start}|${item.end}`),
  );

  for (const proposal of proposals) {
    const proposalKey = `${proposal.title}|${proposal.category}|${proposal.day}|${proposal.start}|${proposal.end}`;
    if (acceptedKeys.has(proposalKey)) continue;

    const conflict = hasTimeConflict(
      proposal,
      existingItems.filter((item) => item.day === proposal.day),
    );
    if (conflict) {
      throw new Error("CONFLICT");
    }
  }

  const additions = proposals.filter((proposal) => {
    const key = `${proposal.title}|${proposal.category}|${proposal.day}|${proposal.start}|${proposal.end}`;
    if (acceptedKeys.has(key)) return false;
    acceptedKeys.add(key);
    return true;
  });

  return [...existingItems, ...additions];
}
