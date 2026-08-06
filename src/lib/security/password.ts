import { randomInt } from "crypto";

const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%*?";
const ALL_CHARS = `${LOWERCASE}${UPPERCASE}${DIGITS}${SYMBOLS}`;

function pick(chars: string) {
  return chars[randomInt(chars.length)]!;
}

function shuffle(chars: string[]) {
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex]!, chars[index]!];
  }
  return chars.join("");
}

export function generateTemporaryPassword(length = 16) {
  const safeLength = Math.max(length, 16);
  const chars = [pick(LOWERCASE), pick(UPPERCASE), pick(DIGITS), pick(SYMBOLS)];

  while (chars.length < safeLength) {
    chars.push(pick(ALL_CHARS));
  }

  return shuffle(chars);
}
