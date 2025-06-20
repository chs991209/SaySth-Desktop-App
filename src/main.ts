import {app, BrowserWindow, ipcMain} from "electron";
import {ChildProcess} from "child_process";
import {startMCPServer, killProcessTree} from "./mcp/handler/local_MCP_handler";
import * as path from "path";
import {Response} from "node-fetch";

let mainWindow: BrowserWindow | null = null;
let mcpProcess: ChildProcess | null = null;


ipcMain.on("request-from-renderer", async (event, actionsListJson): Promise<void> => {
    console.log("Received from renderer:", actionsListJson);
    /*
    {
    "actions_list": [
        {
            "open_webbrowser": [
                "https://www.youtube.com/watch?v=6ZUIwj3FgUY",
                "https://www.youtube.com/watch?v=OPf0YbXqDm0"
            ]
        }
    ]
}
     */

    // 예: FastAPI 서버에 POST 요청 보내기
    // Node.js 내장 fetch(18 이상) 또는 axios, node-fetch 등 사용 가능
    // 예시는 node-fetch 사용 가정
    try {
        const localMCPServerAddress = "http://127.0.0.1:8002/local_actions";

        // node-fetch import 필요: npm install node-fetch
        const fetch = (await import("node-fetch")).default;

        const response: Response = await fetch(localMCPServerAddress, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(actionsListJson),
        })

        const result: any = await response.json();
        /*
                {
            "actions_execution": "Not Fully Done",
            "results": [
                {
                    "action": "open_webbrowser",
                    "input": [
                        "https://www.youtube.com/watch?v=6ZUIwj3FgUY",
                        "https://www.youtube.com/watch?v=OPf0YbXqDm0"
                    ],
                    "result": [
                        {
                            "url": "https://www.youtube.com/watch?v=6ZUIwj3FgUY",
                            "status": "opened"
                        },
                        {
                            "url": "https://www.youtube.com/watch?v=OPf0YbXqDm0",
                            "status": "opened"
                        }
                    ]
                },
                {
                    "action": "execute_programs",
                    "input": [
                        "notepad.exe"
                    ],
                    "result": [
                        {
                            "program": "notepad.exe",
                            "status": "not_found",
                            "error": "Executable 'notepad.exe' not found in PATH."
                        }
                    ]
                }
            ]
        }
         */
        if (result["actions_execution"] != "Not Done") {
            console.log(result);
        } else {
            console.log(result)
            /*
            여기에 모든 액션이 실패했을 때 windows Event handler를 추가하면 좋을 것 같습니다.
            아무것도 안됐다는 메시지라는지.
             */
        }


        event.sender.send("response-from-main", {success: true, data: result});  // 렌더러로 결과 전송
    } catch (err) {
        console.error("Error communicating with FastAPI:", err);


        event.sender.send("response-from-main", { // err가 Error 타입인지 체크 후 message 사용
            success: false,
            error: err instanceof Error ? err.message : String(err),
        });
    }
});

/** 메인 창 생성 및 서버 준비 대기 */
async function createWindow(): Promise<void> {
    startMCPServer();

    // MCP 서버가 준비될 시간을 잠깐 줌 (필요에 따라 조정)
    /*
    이 부분 setTimeout delay 필요 없어 보입니다.
    또는 매우 짧게 조정
    서버 오픈 실행이 너무 빠름

    + local MCP 서버를 띄우는 것 자체가 동기적이지 않나요?
    + 먼저 window를 띄우고 local MCP 서버를 띄우는 게 맞아 보입니다.
     */
    await new Promise((r) => setTimeout(r, 2000));

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });


    mainWindow.loadURL("https://saysthapp.vercel.app/");

    mainWindow.on("closed", () => {
        killProcessTree(mcpProcess);
        mainWindow = null;
    });
}

/** 모든 창이 닫힐 때 서버도 종료하고 앱 종료 */
app.on("window-all-closed", () => {
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
