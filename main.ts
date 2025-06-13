import * as path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs';
import { spawn } from 'child_process';
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function logToFile(message: string) {
    const logPath = path.join(__dirname, 'logs', 'python_exec.log');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`);
}

ipcMain.handle('run-python-code', async (_event, rawCodeJson: string): Promise<string> => {
    try {
        const rawCodeStr = rawCodeJson.split('#CommandDone')[0];
        const parsedCode = JSON.parse(rawCodeStr); // unescaped string
        const pyFilePath = path.join(__dirname, 'generated', 'generated_script.py');
        fs.mkdirSync(path.dirname(pyFilePath), { recursive: true });
        fs.writeFileSync(pyFilePath, parsedCode);

        // logToFile(`Python script written: ${pyFilePath}`);

        return new Promise((resolve, reject) => {
            const py = spawn('python', [pyFilePath]);
            let output = '';
            let error = '';

            py.stdout.on('data', (data) => {
                output += data.toString();
                // logToFile(`[stdout] ${data}`);
            });

            py.stderr.on('data', (data) => {
                error += data.toString();
                // logToFile(`[stderr] ${data}`);
            });

            py.on('close', (code) => {
                if (code !== 0) {
                    const errMsg = `Exited with code ${code}`;
                    // logToFile(errMsg);
                    reject(new Error(errMsg + ': ' + error));
                } else {
                    // logToFile('Execution completed successfully.');
                    resolve(output);
                }
            });
        });
    } catch (err) {
        // logToFile(`Error in Python code handling: ${(err as Error).message}`);
        throw err;
    }
});

app.whenReady().then(() => {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        }
    });
    win.loadFile('index.html');
});