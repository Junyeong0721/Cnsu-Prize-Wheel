import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PRIZES,
  pickWinner,
  validatePrizes,
  targetRotation,
  readSaved,
  randomInt,
} from "../src/wheel.ts";

test("all 100 equally likely tickets match the configured percentages exactly", () => {
  const counts = DEFAULT_PRIZES.map(() => 0);
  for (let ticket = 0; ticket < 100; ticket++)
    counts[pickWinner(DEFAULT_PRIZES, ticket)]++;
  assert.deepEqual(counts, [30, 20, 10, 5, 20, 15]);
});
test("zero-percent prizes never win and a 100-percent prize always wins", () => {
  for (let winner = 0; winner < DEFAULT_PRIZES.length; winner++) {
    const prizes = DEFAULT_PRIZES.map((p, i) => ({
      ...p,
      probability: i === winner ? 100 : 0,
    }));
    for (let ticket = 0; ticket < 100; ticket++)
      assert.equal(pickWinner(prizes, ticket), winner);
  }
});
test("reject fractional, empty, negative, over-100 and non-totaling probabilities", () => {
  for (const value of [30.5, "30.0", "", -1, 101, "1e1", 29]) {
    assert.ok(
      validatePrizes(
        DEFAULT_PRIZES.map((p, i) =>
          i === 0 ? { ...p, probability: value } : p,
        ),
      ),
    );
  }
  assert.equal(validatePrizes(DEFAULT_PRIZES), null);
  assert.ok(
    validatePrizes(
      DEFAULT_PRIZES.map((p, i) => (i === 0 ? { ...p, name: "  " } : p)),
    ),
  );
  assert.throws(() => pickWinner(DEFAULT_PRIZES, 100));
});
test("every final pointer position matches the selected prize for 2–12 sectors and repeated spins", () => {
  let current = 0;
  for (let count = 2; count <= 12; count++)
    for (let index = 0; index < count; index++)
      for (const fraction of [0.2, 0.5, 0.8]) {
        const next = targetRotation(current, index, count, fraction);
        assert.ok(next - current >= 2160);
        const pointerAngle = (360 - (next % 360)) % 360;
        assert.equal(Math.floor(pointerAngle / (360 / count)), index);
        current = next;
      }
});
test("saved configuration survives reload, rejects corrupt data, and caps history", () => {
  const saved = {
    prizes: DEFAULT_PRIZES,
    title: "이벤트",
    history: Array.from({ length: 110 }, (_, i) => ({
      id: String(i),
      name: "커피",
      probability: 30,
      color: "#F07A61",
      at: new Date().toISOString(),
    })),
  };
  assert.deepEqual(readSaved(JSON.stringify(saved)).prizes, DEFAULT_PRIZES);
  assert.equal(readSaved(JSON.stringify(saved)).history.length, 100);
  assert.equal(readSaved("bad json"), null);
  assert.equal(readSaved(JSON.stringify({ ...saved, prizes: [{}] })), null);
});
test("secure random tickets remain in the 0–99 range", () => {
  for (let i = 0; i < 1000; i++) {
    const value = randomInt(100);
    assert.ok(Number.isInteger(value) && value >= 0 && value < 100);
  }
});

test("saved settings reject invalid IDs, colors, probability types and duplicate prizes", () => {
  const saved = { title: "학교 행사", prizes: DEFAULT_PRIZES, history: [] };
  for (const change of [
    { id: "" },
    { id: DEFAULT_PRIZES[1].id },
    { color: "url(https://invalid.test)" },
    { probability: [30] },
    { probability: null },
    { name: " " },
  ]) {
    const bad = {
      ...saved,
      prizes: saved.prizes.map((p, i) => (i === 0 ? { ...p, ...change } : p)),
    };
    assert.equal(readSaved(JSON.stringify(bad)), null);
  }
  assert.equal(readSaved(JSON.stringify(saved)).title, "학교 행사");
});
