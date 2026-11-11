const {
  app,
  BrowserWindow,
  protocol,
  session,
  shell,
  Menu,
  dialog,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");

app.setName("CNSU Lucky Spin");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "cnsu",
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
let mainWindow;
const schoolLinks = new Set([
  "https://www.cnsu.ac.kr/univ/main.do",
  "https://www.cnsu.ac.kr/entra/main.do",
]);
function openSchool(url) {
  if (schoolLinks.has(url)) void shell.openExternal(url);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app
    .whenReady()
    .then(async () => {
      protocol.handle("cnsu", (request) => {
        const url = new URL(request.url);
        if (
          url.hostname !== "app" ||
          !["/", "/index.html"].includes(url.pathname)
        )
          return new Response("Not found", { status: 404 });
        return new Response(
          fs.readFileSync(path.join(app.getAppPath(), "dist/index.html")),
          { headers: { "content-type": "text/html; charset=utf-8" } },
        );
      });
      session.defaultSession.setPermissionRequestHandler(
        (_contents, permission, callback) =>
          callback(permission === "fullscreen"),
      );
      session.defaultSession.setPermissionCheckHandler(
        (_contents, permission) => permission === "fullscreen",
      );
      Menu.setApplicationMenu(null);
      mainWindow = new BrowserWindow({
        width: 1440,
        height: 980,
        minWidth: 860,
        minHeight: 650,
        show: false,
        title: "충남도립대학교 · CNSU 럭키 스핀",
        backgroundColor: "#f3f6fb",
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          devTools: !app.isPackaged,
        },
      });
      mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        openSchool(url);
        return { action: "deny" };
      });
      mainWindow.webContents.on("will-navigate", (event, url) => {
        if (url !== "cnsu://app/" && url !== "cnsu://app/index.html") {
          event.preventDefault();
          openSchool(url);
        }
      });
      mainWindow.webContents.on("before-input-event", (event, input) => {
        if (input.type !== "keyDown") return;
        if (input.key === "F11") {
          event.preventDefault();
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        }
        if (input.key === "Escape" && mainWindow.isFullScreen())
          mainWindow.setFullScreen(false);
      });
      mainWindow.once("ready-to-show", () => mainWindow.show());
      mainWindow.on("closed", () => {
        mainWindow = null;
      });
      await mainWindow.loadURL("cnsu://app/");
    })
    .catch((error) => {
      dialog.showErrorBox("실행 오류", String(error));
      app.quit();
    });
  app.on("window-all-closed", () => app.quit());
}
