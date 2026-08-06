import test from "node:test";
import assert from "node:assert/strict";
import { generateTemporaryPassword } from "../src/lib/security/password";

test("generates a temporary password with practical complexity", () => {
  const password = generateTemporaryPassword();

  assert.equal(password.length >= 16, true);
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[!@#$%*?]/);
});

test("generates different temporary passwords", () => {
  const first = generateTemporaryPassword();
  const second = generateTemporaryPassword();

  assert.notEqual(first, second);
});
