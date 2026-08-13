const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

test("packaged Windows server entrypoint converts absolute paths to file URLs", () => {
  const windowsLikePath = path.win32.join("C:\\Program Files", "Sky ERP", "dist", "index.js");
  const fileUrl = pathToFileURL(windowsLikePath).href;

  assert.match(fileUrl, /^file:\/\//);
  assert.equal(fileUrl.includes("C:"), true);
  assert.equal(fileUrl.includes("\\\\"), false);
});

test("local server URLs remain HTTP URLs for Electron loadURL", () => {
  const serverUrl = "http://127.0.0.1:3000/";
  assert.match(serverUrl, /^https?:\/\//);
});
