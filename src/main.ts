// src/main/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import { spawn } from "child_process";
import * as path from "path";
import isDev from "electron-is-dev";

let mainWindow: BrowserWindow | null = null;

/**
 * 주어진 Python 코드를 실행하고 stdout 결과를 Promise로 반환합니다.
 */
function runPythonCode(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const py = spawn("python", ["-c", code]);
    let out = "",
      err = "";

    py.stdout.on("data", (data) => {
      out += data.toString();
    });
    py.stderr.on("data", (data) => {
      err += data.toString();
    });
    py.on("close", () => {
      if (err) reject(err);
      else resolve(out);
    });
  });
}

// 렌더러(Renderer)에서 runPythonCode 요청이 들어오면 처리
ipcMain.handle("run-python", async (_event, code: string) => {
  return runPythonCode(code);
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // preload 스크립트에서 contextBridge를 통해 안전하게 API를 노출
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // 개발 모드: Next.js dev 서버
    mainWindow.loadURL("http://localhost:3000");
  } else {
    // 프로덕션 모드: Next.js 빌드 후 export된 정적 파일
    const indexHtml = path.join(__dirname, "../renderer/out/index.html");
    mainWindow.loadFile(indexHtml);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // macOS: Dock 아이콘 클릭 시 윈도우 재생성
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫히면 앱 종료 (macOS 제외)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
