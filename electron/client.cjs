const { app, BrowserWindow, dialog } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

function readServerUrl() {
  const arg = process.argv.find(value => value.startsWith("--server-url="));
  if (arg) return arg.slice("--server-url=".length).replace(/\/$/, "");
  if (process.env.SKY_ERP_SERVER_URL) return process.env.SKY_ERP_SERVER_URL.replace(/\/$/, "");

  const configPath = path.join(app.getPath("userData"), "client-config.json");
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (typeof config.serverUrl === "string" && config.serverUrl.trim()) {
      return config.serverUrl.trim().replace(/\/$/, "");
    }
  } catch {
    // First run: use the local default and show a clear error if unavailable.
  }
  return "http://127.0.0.1:3000";
}

async function createWindow() {
  const serverUrl = readServerUrl();
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    dialog.showErrorBox(
      "Sky ERP Client",
      `تعذر الاتصال بالخادم المركزي:\n${serverUrl}\n\n${errorDescription} (${errorCode})\n\nأنشئ الملف client-config.json داخل مجلد إعدادات Sky ERP واكتب serverUrl بعنوان الخادم المركزي.`
    );
  });
  await window.loadURL(`${serverUrl}/`);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
