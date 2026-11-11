import {
  mkdir,
  readFile,
  writeFile,
  copyFile,
  readdir,
} from "node:fs/promises";
import { createHash } from "node:crypto";
const { version, build } = JSON.parse(await readFile("package.json", "utf8"));
const releaseDirectory = build.directories.output;
const destination = `${releaseDirectory}/distribution`;
await mkdir(destination, { recursive: true });
const exe = `CNSU-Lucky-Spin-${version}-Windows-x64.exe`;
await copyFile(`${releaseDirectory}/${exe}`, `${destination}/${exe}`);
await copyFile(
  "dist/CNSU-Lucky-Spin.html",
  `${destination}/CNSU-Lucky-Spin.html`,
);
for (const name of [
  "LICENSE",
  "README.md",
  "BRANDING.md",
  "THIRD_PARTY_NOTICES.md",
])
  await copyFile(name, `${destination}/${name}`);
for (const name of ["LICENSE.electron.txt", "LICENSES.chromium.html"])
  await copyFile(
    `${releaseDirectory}/win-unpacked/${name}`,
    `${destination}/${name}`,
  );
await writeFile(
  `${destination}/사용방법.txt`,
  `충남도립대학교 CNSU 럭키 스핀 ${version}\n\n1. Windows 10/11 64비트: ${exe} 더블클릭\n2. 다른 운영체제: CNSU-Lucky-Spin.html을 브라우저로 열기\n3. 경품과 정수 확률 입력 → 합계 100% 확인 → 설정 적용 → 돌림판 돌리기\n\n설치·로그인·인터넷 없이 추첨할 수 있습니다. 홈페이지 링크는 인터넷 연결이 필요합니다.\n설정과 추첨 기록은 현재 기기에 자동으로 저장됩니다.\n이 EXE는 코드 서명이 없는 배포본입니다. 자세한 내용은 README.md를 읽어 주세요.\n`,
);
const lines = [];
for (const name of (await readdir(destination))
  .filter((n) => n !== "SHA256SUMS.txt")
  .sort()) {
  lines.push(
    `${createHash("sha256")
      .update(await readFile(`${destination}/${name}`))
      .digest("hex")}  ${name}`,
  );
}
await writeFile(`${destination}/SHA256SUMS.txt`, lines.join("\n") + "\n");
console.log(`Release ${version} prepared at ${destination}`);
