import test from "node:test";
import assert from "node:assert/strict";
import {
  fitWheelLabel,
  LABEL_MAX_FONT,
  LABEL_INNER_RADIUS,
  LABEL_OUTER_RADIUS,
  LABEL_EDGE_GAP,
} from "../src/wheel-label.ts";

test("complete short and long names fit between the hub, rim and adjacent slice boundaries", () => {
  for (let percent = 1; percent <= 100; percent++) {
    for (const width of [18, 72, 180, 432, 600]) {
      for (const height of [18, 22, 30]) {
        const font = fitWheelLabel(percent * 3.6, width, height);
        assert.ok(font > 0 && font <= LABEL_MAX_FONT);
        const scale = font / LABEL_MAX_FONT;
        const inner = LABEL_OUTER_RADIUS - width * scale;
        assert.ok(inner >= LABEL_INNER_RADIUS - 1e-9);
        if (percent < 50) {
          assert.ok(
            (height * scale) / 2 + LABEL_EDGE_GAP <=
              inner * Math.tan((percent * Math.PI) / 100) + 1e-9,
          );
        }
        assert.ok(Math.hypot(LABEL_OUTER_RADIUS, (height * scale) / 2) < 218);
      }
    }
  }
});

test("labels grow again when their slice gets wider or their name gets shorter", () => {
  assert.ok(fitWheelLabel(3.6, 180, 22) < fitWheelLabel(7.2, 180, 22));
  assert.ok(fitWheelLabel(7.2, 432, 22) < fitWheelLabel(7.2, 72, 22));
  assert.equal(fitWheelLabel(180, 72, 22), LABEL_MAX_FONT);
});
