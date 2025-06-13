let onRecording = false;
let audioChunk: BlobPart[] = [];
let mediaRecorder: MediaRecorder;

const AudioType = 'audio/wav';
const TEXTPOSTURL = `https://cfdd-61-99-5-60.ngrok-free.app/execute`;
const AUDIOPOSTURL = `https://481b-39-122-179-149.ngrok-free.app/stt_base64`;

// 음성, 텍스트 입력 수신기
window.addEventListener('DOMContentLoaded', (): void => {
    console.log('DOM fully loaded and parsed');

    const userTextCommandInput = document.querySelector<HTMLInputElement>('.user_input');
    const micIcon = document.querySelector<HTMLDivElement>('.mic-icon');


    if (!userTextCommandInput || !micIcon) {
        console.error('Missing .user_input or .mic-icon element in DOM');
        return;
    }

    //
    userTextCommandInput.addEventListener('keydown', async (e: KeyboardEvent): Promise<void> => {
        if (e.key === 'Enter' && userTextCommandInput.value.trim() !== '') {
            const userMessage = userTextCommandInput.value.trim();
            console.log('Enter pressed:', userMessage);
            userTextCommandInput.value = ''; // Clear input early for UX

            try {
                console.log('before fetching')
                const res = await fetch(TEXTPOSTURL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({prompt: userMessage}),
                });
                const data = await res.json();
                if (data?.code) {
                    console.log('electronAPI exists:', typeof window.electronAPI !== 'undefined');
                    await run(data.code);
                } else {
                    console.warn('No Python code returned from server');
                }
                console.log('API response:', data);
                await run(data.code);
            } catch (err) {
                console.error('Error sending message:', err);
            }
        }
    });


    async function initiateVoiceRecord(): Promise<void> {
        // @ts-ignore
        micIcon.innerHTML = `<i class="fa-solid fa-bars-staggered"></i>`;
        // @ts-ignore
        micIcon.classList.add('rainbow');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true});
            mediaRecorder = new MediaRecorder(stream);
            audioChunk = [];

            mediaRecorder.ondataavailable = (event) => audioChunk.push(event.data);

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunk, {type: AudioType});
                const reader = new FileReader();

                reader.onloadend = async () => {
                    const base64Data = (reader.result as string).split(',')[1];
                    const payload = {
                        fileName: 'voice_file.wav',
                        mimeType: AudioType,
                        data: base64Data
                    };

                    try {
                        const response = await fetch(AUDIOPOSTURL, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify(payload)
                        });
                        if (!response.ok) throw new Error(`Server error: ${response.status}`);
                        const result = await response.json();
                        console.log('Upload success:', result);
                    } catch (err) {
                        console.error('Upload failed:', err);
                    }
                };
                reader.readAsDataURL(audioBlob);
            };

            onRecording = true;
            mediaRecorder.start();
        } catch (e) {
            console.error('Mic access error:', e);
        }
    }

    async function run(codeJson: string): Promise<void> {
        try {
            const result = await window.electronAPI.runPythonCode(codeJson);
            console.log('Python Result:', result);
        } catch (e) {
            console.error('Python execution failed:', e);
        }
    }

    function endVoiceRecord(): void {
        mediaRecorder.stop();
        onRecording = false;
        // @ts-ignore
        micIcon.classList.remove('rainbow');
        // @ts-ignore
        micIcon.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
    }

    micIcon.addEventListener('click', () => {
        if (!onRecording) {
            initiateVoiceRecord();
        } else {
            endVoiceRecord();
        }
    });


});

