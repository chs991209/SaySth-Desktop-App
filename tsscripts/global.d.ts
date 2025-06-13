export {};

declare global {
    interface Window {
        electronAPI: {
            runPythonCode: (codeJson: string) => Promise<string>;
        };
    }
}