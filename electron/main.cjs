const { app, BrowserWindow, dialog } = require("electron");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
process.env.NODE_ENV = "production";
process.env.HOST = process.env.HOST || "0.0.0.0";
process.env.PORT = String(PORT);

let serverStarted = false;

async function startServer() {
  const serverEntry = path.join(__dirname, "..", "dist", "index.js");
  await import(serverEntry);
  serverStarted = true;
}

async function createWindow() {
  try {
    await startServer();
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
    await window.loadURL(`http://127.0.0.1:${PORT}/`);
  } catch (error) {
    console.error(error);
    dialog.showErrorBox(
      "Sky ERP",
      `تعذر تشغيل خادم Sky ERP المحلي. تحقق من إعدادات قاعدة البيانات والملفات المطلوبة.\n\n${error instanceof Error ? error.message : String(error)}`
    );
    app.quit();
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("before-quit", () => {
  if (!serverStarted) return;
});
