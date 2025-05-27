/* Server Side */
const { app, BrowserWindow, ipcMain } = require("electron");
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');


const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    center : true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile("index.html");
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
