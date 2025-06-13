import { app, BrowserWindow, ipcMain } from "electron";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import kill from "tree-kill";
import isDev from "electron-is-dev";
import waitOn from "wait-on";

let mainWindow: BrowserWindow | null = null;
let nextProcess: ChildProcess | null = null;
let mcpProcess: ChildProcess | null = null;

/** Next.js 개발 서버 실행 */
function startNextServer() {
  const rendererPath = path.join(__dirname, "../renderer");
  nextProcess = spawn("npm", ["run", "dev"], {
    cwd: rendererPath,
    shell: true,
    stdio: "inherit",
    windowsHide: true,
  });
  console.log(`Next.js Server listening on: http://127.0.0.1:8000`);
}

/** MCP(FastAPI) 서버 실행 */
function startMCPServer() {
  mcpProcess = spawn(
    "python",
    [
      "-m",
      "uvicorn",
      "mcp_server.main:app",
      "--host",
      "127.0.0.1",
      "--port",
      "8001",
      "--reload", // 개발 중만 필요
    ],
    {
      cwd: path.join(__dirname, ".."),
      shell: true,
      stdio: "inherit",
      windowsHide: true,
    }
  );
  console.log(`MCP Server listening on: http://127.0.0.1:8001`);
}

/** 프로세스와 자식 프로세스까지 안전하게 종료 */
function killProcessTree(process: ChildProcess | null) {
  if (process?.pid) {
    kill(process.pid, "SIGTERM");
  }
}

/** 임의의 Python 코드 실행 및 결과 Promise 반환 */
function runPythonCode(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const py = spawn("python", ["-c", code]);
    let out = "",
      err = "";

    py.stdout.on("data", (data) => (out += data.toString()));
    py.stderr.on("data", (data) => (err += data.toString()));

    py.on("close", () => (err ? reject(err) : resolve(out)));
  });
}

// 렌더러에서 runPythonCode IPC 처리
ipcMain.handle("run-python", async (_event, code: string) =>
  runPythonCode(code)
);

/** 메인 창 생성 및 서버 준비 대기 */
async function createWindow() {
  if (isDev) {
    startNextServer();
    startMCPServer();

    // Next.js dev 서버 준비될 때까지 대기 (최대 5초)
    try {
      await waitOn({ resources: ["http://localhost:8000"], timeout: 2000 });
      console.log("Next.js dev 서버가 준비되었습니다.");
    } catch (err) {
      console.error("wait-on: Next.js dev 서버 대기 실패:", err);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.openDevTools();

  if (isDev) {
    mainWindow.loadURL("http://localhost:8000/");
    //const indexHtml = path.join(__dirname, "../renderer/out/index.html");
    //mainWindow.loadFile(indexHtml);
  } else {
    const indexHtml = path.join(__dirname, "../renderer/out/index.html");
    mainWindow.loadFile(indexHtml);
  }

  mainWindow.on("closed", () => {
    killProcessTree(nextProcess);
    killProcessTree(mcpProcess);
    mainWindow = null;
  });
}

/** 모든 창이 닫힐 때 서버도 종료하고 앱 종료 */
app.on("window-all-closed", () => {
  killProcessTree(nextProcess);
  killProcessTree(mcpProcess);
  if (process.platform !== "darwin") app.quit();
});

/** 맥OS용 창 활성화 핸들러 */
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

/** 앱 준비되면 실행 */
app.whenReady().then(createWindow);
