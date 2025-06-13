import {ChildProcessWithoutNullStreams, spawn} from 'child_process';

export function runPythonCode(code: string): Promise<string> {
    return new Promise((resolve, reject): void => {
        const py: ChildProcessWithoutNullStreams = spawn('python', ['-c', code]);
        let out: string = '';
        let err: string = '';

        py.stdout.on('data', (data: Buffer): void => {
            out += data.toString();
        });

        py.stderr.on('data', (data: Buffer): void => {
            err += data.toString();
        });

        py.on('close', (_code: number): void => {
            if (err) {
                reject(err);
            } else {
                resolve(out);
            }
        });
    });
}

module.exports = runPythonCode;