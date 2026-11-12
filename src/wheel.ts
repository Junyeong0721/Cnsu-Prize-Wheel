export const COLORS = [
  "#BFD6FF",
  "#A9E8D4",
  "#DFEB9D",
  "#FFD28B",
  "#F8B5CA",
  "#D4BCED",
  "#AAD9F1",
  "#BFE1AD",
  "#F4E59C",
  "#F6BD9D",
  "#D7C7F0",
  "#B8DFDF",
];
export type Prize = {
  id: string;
  name: string;
  probability: number | string;
  color: string;
};
export type Draw = {
  id: string;
  name: string;
  probability: number;
  color: string;
  at: string;
};
export const DEFAULT_PRIZES: Prize[] = [
  { id: "coffee", name: "커피 쿠폰", probability: 30, color: COLORS[0] },
  { id: "discount", name: "CNSU 굿즈", probability: 20, color: COLORS[1] },
  { id: "gift", name: "대학 기념품", probability: 10, color: COLORS[2] },
  { id: "special", name: "스페셜 선물", probability: 5, color: COLORS[3] },
  { id: "again", name: "다음 기회에", probability: 20, color: COLORS[4] },
  { id: "snack", name: "달콤한 간식", probability: 15, color: COLORS[5] },
];
export function validatePrizes(prizes: Prize[]): string | null {
  if (prizes.length < 2 || prizes.length > 12)
    return "경품은 2~12개로 설정해 주세요.";
  if (prizes.some((p) => !p.name.trim()))
    return "모든 경품 이름을 입력해 주세요.";
  if (
    prizes.some(
      (p) =>
        !["number", "string"].includes(typeof p.probability) ||
        p.probability === "" ||
        !/^\d+$/.test(String(p.probability)) ||
        !Number.isInteger(Number(p.probability)) ||
        Number(p.probability) < 0 ||
        Number(p.probability) > 100,
    )
  )
    return "확률은 0~100 사이의 정수로 입력해 주세요.";
  const total = prizes.reduce((sum, p) => sum + Number(p.probability), 0);
  if (total !== 100)
    return total < 100
      ? `합계가 100%가 되도록 ${100 - total}%를 더해 주세요.`
      : `합계가 100%가 되도록 ${total - 100}%를 줄여 주세요.`;
  return null;
}
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 4294967296)
    throw new Error("Invalid range");
  const limit = Math.floor(4294967296 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}
export function pickWinner(prizes: Prize[], ticket: number): number {
  if (
    validatePrizes(prizes) ||
    !Number.isInteger(ticket) ||
    ticket < 0 ||
    ticket >= 100
  )
    throw new Error("Invalid draw");
  let sum = 0;
  for (let i = 0; i < prizes.length; i++) {
    sum += Number(prizes[i].probability);
    if (ticket < sum) return i;
  }
  throw new Error("Invalid probabilities");
}
export function wheelSectors(prizes: Prize[]) {
  if (validatePrizes(prizes)) throw new Error("Invalid probabilities");
  let total = 0;
  return prizes
    .map((prize, index) => {
      const startAngle = (total / 100) * 360;
      total += Number(prize.probability);
      return { index, startAngle, endAngle: (total / 100) * 360 };
    })
    .filter((sector) => sector.endAngle > sector.startAngle);
}
export function targetRotation(
  current: number,
  index: number,
  prizes: Prize[],
  fraction: number,
): number {
  const sector = wheelSectors(prizes).find((item) => item.index === index);
  if (!sector || !Number.isFinite(fraction) || fraction <= 0 || fraction >= 1)
    throw new Error("Invalid landing position");
  const angle =
    sector.startAngle + (sector.endAngle - sector.startAngle) * fraction;
  const target = (360 - angle) % 360;
  return current + 360 * 6 + ((target - (current % 360) + 360) % 360);
}
export function readSaved(
  raw: string | null,
): { prizes: Prize[]; title: string; history: Draw[] } | null {
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw);
    if (
      !Array.isArray(saved.prizes) ||
      typeof saved.title !== "string" ||
      !saved.title.trim() ||
      saved.title.length > 40
    )
      return null;
    const goodPrize = (p: Prize) =>
      p &&
      typeof p.id === "string" &&
      p.id.length > 0 &&
      p.id.length <= 64 &&
      typeof p.name === "string" &&
      p.name.trim().length > 0 &&
      p.name.length <= 24 &&
      typeof p.color === "string" &&
      /^#[0-9a-f]{6}$/i.test(p.color);
    if (
      !saved.prizes.every(goodPrize) ||
      new Set(saved.prizes.map((p: Prize) => p.id)).size !==
        saved.prizes.length ||
      validatePrizes(saved.prizes)
    )
      return null;
    const history = Array.isArray(saved.history)
      ? saved.history
          .filter(
            (d: Draw) =>
              goodPrize(d) &&
              Number.isInteger(d.probability) &&
              d.probability >= 0 &&
              d.probability <= 100 &&
              typeof d.at === "string" &&
              Number.isFinite(Date.parse(d.at)),
          )
          .slice(0, 100)
      : [];
    return { prizes: saved.prizes, title: saved.title, history };
  } catch {
    return null;
  }
}
