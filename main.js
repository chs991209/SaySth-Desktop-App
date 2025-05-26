/* Server Side */
const { app, BrowserWindow } = require("electron");

const { spawn } = require('child_process');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    center : true
  });
  win.loadFile("index.html");
  // python file 실행
  /* const result = spawn('python', ['test.py'])
  result.stdout.on('data', function (data) {
    console.log(data.toString());
  });
  result.stderr.on('data', function (data) {
    console.log(data.toString());
  }); */

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
