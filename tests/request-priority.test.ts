import test from "node:test";
import assert from "node:assert/strict";
import {
  PRIORITY_THRESHOLD_DAYS,
  getRequestPriority,
  isRequestOverdue,
} from "../src/lib/requests/priority";

const now = new Date("2026-08-07T12:00:00.000-03:00");

test("marks pending requests older than two days as overdue", () => {
  assert.equal(
    isRequestOverdue({
      status: "AGUARDANDO_CONFERENCIA",
      createdAt: "2026-08-05T11:59:59.000-03:00",
      now,
    }),
    true
  );
});

test("does not mark pending requests before the two-day tolerance", () => {
  assert.equal(
    isRequestOverdue({
      status: "AGUARDANDO_CONFERENCIA",
      createdAt: "2026-08-05T12:00:01.000-03:00",
      now,
    }),
    false
  );
});

test("does not mark finalized requests as overdue", () => {
  assert.equal(
    isRequestOverdue({
      status: "APROVADA",
      createdAt: "2026-08-01T12:00:00.000-03:00",
      now,
    }),
    false
  );
});

test("returns days open for priority labels", () => {
  const priority = getRequestPriority({
    status: "AGUARDANDO_CORRECAO",
    createdAt: "2026-08-04T12:00:00.000-03:00",
    now,
  });

  assert.equal(priority.overdue, true);
  assert.equal(priority.daysOpen, 3);
  assert.equal(PRIORITY_THRESHOLD_DAYS, 2);
});
