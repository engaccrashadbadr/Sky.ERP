const { app, BrowserWindow, dialog } = require("electron");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
process.env.NODE_ENV = "production";
process.env.HOST = process.env.HOST || "0.0.0.0";
process.env.PORT = String(PORT);

async function startServer() {
  await import(path.join(__dirname, "..", "dist", "index.js"));
}

async function createWindow() {
  try {
    await startServer();
    const window = new BrowserWindow({
      width: 900,
      height: 600,
      show: true,
      autoHideMenuBar: true,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });
    await window.loadURL(`http://127.0.0.1:${PORT}/`);
  } catch (error) {
    dialog.showErrorBox(
      "Sky ERP Server",
      `تعذر تشغيل خادم Sky ERP المركزي. تحقق من قاعدة البيانات والإعدادات.\n\n${error instanceof Error ? error.message : String(error)}`
    );
    app.quit();
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
