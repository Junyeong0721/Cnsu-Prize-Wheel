# 외부 구성 요소

프로젝트의 직접 의존성은 `package.json`, 정확한 설치 버전은 `package-lock.json`에 기록되어 있습니다.

| 구성 요소             | 용도                   | 라이선스                                         |
| --------------------- | ---------------------- | ------------------------------------------------ |
| React / React DOM     | 사용자 화면            | MIT                                              |
| Lucide                | 아이콘                 | ISC                                              |
| Electron              | Windows 실행 환경      | MIT 및 포함된 Chromium/Node 구성 요소의 라이선스 |
| electron-builder      | 실행파일 패키징        | MIT                                              |
| esbuild               | 브라우저용 코드 묶기   | MIT                                              |
| sharp                 | 앱 아이콘의 SVG 렌더링 | Apache-2.0                                       |
| png-to-ico            | Windows 아이콘 생성    | MIT                                              |
| TypeScript / Prettier | 개발 도구              | Apache-2.0 / MIT                                 |

번들 JavaScript의 라이선스 주석은 빌드 결과 안에 보존합니다. Windows 배포물의 Electron/Chromium 라이선스 원문도 함께 배포하세요. 이 프로젝트의 배포 준비 스크립트가 `release/1.0.2/win-unpacked`의 `LICENSE.electron.txt`와 `LICENSES.chromium.html`을 배포 폴더로 복사합니다.

학교 로고는 `BRANDING.md`를 확인하세요.
