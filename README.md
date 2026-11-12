# CNSU Prize Wheel

충남도립대학교 홍보 행사에서 사용하는 오프라인 경품 돌림판입니다.
경품과 정수 확률을 설정할 수 있으며, 설정과 추첨 기록은 현재 기기에 자동 저장됩니다.

## 실행 방법

1. [Node.js](https://nodejs.org/en/download) **24.x**를 설치합니다.
2. 이 저장소에서 **Code → Download ZIP**을 눌러 압축을 풀거나 Git으로 복제합니다.
3. `package.json`이 있는 폴더에서 터미널을 열고 아래 명령을 순서대로 실행합니다. Windows에서는 파일 탐색기 주소창에 `cmd`를 입력해 열 수 있습니다.

```sh
npm ci
npm start
```

처음 `npm ci`를 실행할 때는 인터넷이 필요합니다. 설치 후 `npm start`를 실행하면 돌림판 창이 열립니다. 다음부터는 `npm start`만 실행하면 됩니다.

경품 이름과 확률을 입력하고 **합계 100% → 설정 적용 → 돌림판 돌리기** 순서로 사용하세요. 확률은 0~100 사이의 정수만 입력할 수 있습니다. **칸 크기와 당첨 확률 모두 설정값을 따릅니다.** 예를 들어 2% 경품은 원의 2%(7.2°)를 차지하며, 매 추첨마다 당첨 확률이 2%입니다. 0% 경품은 룰렛과 당첨 대상에서 제외됩니다. 각 추첨은 독립적이므로 100번 중 반드시 2번 당첨되는 것은 아닙니다.

돌림판에는 경품 이름만 표시하며, 작은 칸이나 긴 이름은 칸에 맞게 글자 크기가 자동 조절됩니다. 확률 수치는 오른쪽 경품 설정에서 확인합니다.

## 배포 파일 만들기

Windows 실행파일은 Windows에서 아래 명령으로 만듭니다.

```sh
npm run dist:win
```

완성된 EXE는 `release/1.0.4/`에 생성됩니다. 이 파일을 받은 사람은 Node.js 설치 없이 더블클릭으로 사용할 수 있습니다.

브라우저에서 열 수 있는 HTML 파일만 만들려면 아래 명령을 실행합니다.

```sh
npm run build
```

`dist/CNSU-Lucky-Spin.html` 파일 하나를 배포하면 됩니다. EXE와 HTML 모두 추첨에 인터넷이 필요하지 않습니다.

GitHub에서도 **Actions → Build Windows release → Run workflow**로 배포 파일을 만들 수 있습니다. 완료된 실행의 Artifacts에서 내려받으세요.

## 개발 및 라이선스

- React · TypeScript · Electron으로 만들었습니다.
- 검사: `npm run build`, `npm run typecheck`, `npm test`
- 소스 코드는 [MIT 라이선스](LICENSE)입니다. 학교 이름과 로고는 별도 권리를 따릅니다. [브랜딩 안내](BRANDING.md) · [외부 라이브러리](THIRD_PARTY_NOTICES.md)
