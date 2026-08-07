export const PRIORITY_THRESHOLD_DAYS = 2;

const PRIORITY_STATUSES = ["AGUARDANDO_CONFERENCIA", "AGUARDANDO_CORRECAO"];
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type PriorityInput = {
  status: string;
  createdAt: string;
  now?: Date;
};

export function getRequestPriority({ status, createdAt, now = new Date() }: PriorityInput) {
  const createdDate = new Date(createdAt);
  const ageMs = now.getTime() - createdDate.getTime();
  const daysOpen = Math.max(0, Math.floor(ageMs / DAY_IN_MS));
  const overdue = PRIORITY_STATUSES.includes(status) && ageMs > PRIORITY_THRESHOLD_DAYS * DAY_IN_MS;

  return {
    overdue,
    daysOpen,
  };
}

export function isRequestOverdue(input: PriorityInput) {
  return getRequestPriority(input).overdue;
}
