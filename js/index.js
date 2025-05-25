/* Client Side */
const user_input = document.querySelector(".user_input");
const micIcon = document.querySelector(".mic-icon");

let onRecording = false;
let audioChunk = [];
let mediaRecoder;

const AudioType = 'audio/wav';

const TEXTPOSTURL = `https://526b-59-1-100-185.ngrok-free.app/receive-text`;
const AUDIOPOSTURL = ``;

/* 
사용자 입력
*/
user_input.addEventListener("keydown", async function (e) {
  if (e.key == "Enter" && user_input.value.trim() !== "") {
    const userMessage = user_input.value.trim();
    console.log(userMessage);
    try{
      const res = await fetch(TEXTPOSTURL, {
        method : 'POST',
        headers: {
          "Content-Type": "application/json"   // JSON임을 명시
        },
        body: JSON.stringify({"text": userMessage })
      });
      console.log(JSON.stringify({"text": userMessage }));
      
      const data = await res.json();
      console.log(`Response : ${data}`);
      user_input.value = "";
    } catch(e){
      console.error(`${e}`);
    }
  }
});

async function urlToblob(audioUrl) {
  const res = await fetch(audioUrl);
  return await res.blob();
}

async function startRecording() {
  micIcon.innerHTML = `<i class="fa-solid fa-bars-staggered"></i>`;
  micIcon.classList.add('rainbow');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecoder = new MediaRecorder(stream);
    audioChunk = [];

    mediaRecoder.ondataavailable = function (event) {
      audioChunk.push(event.data);
    };

    mediaRecoder.onstop = function () {
      const audioblob = new Blob(audioChunk, { type: AudioType });
      audioChunk = []; // 청크 초기화
      const reader = new FileReader();
      const audioURL = URL.createObjectURL(audioblob);
      reader.readAsDataURL(audioblob);
      console.log(audioURL);

      const blob = urlToblob(audioURL);

      const wavFile = new File([blob], 'voice_file.wav', {type : AudioType});

      const formData = new FormData();
      formData.append('file', wavFile);
      console.log(wavFile);
      /* for debug */
      /* let entries = formData.entries();
      for (const pair of entries) {
          console.log(pair[0]+ ', ' + pair[1]); 
      } */
      
      // post to FastAPI
      
      reader.onload = function () {
        const base64audio = reader.result;
        localStorage.setItem("recorded file", base64audio);
      };
    };
    onRecording = true;
    mediaRecoder.start();
  } catch (e) {
    console.log(`마이크 접근 오류 ${e}`);
  }
}

function stopRecording() {
  /* 녹음 중 일 때 */
  mediaRecoder.stop();
  onRecording = false;  
  micIcon.classList.remove('rainbow');
  micIcon.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
}

/* 
마이크 아이콘 선택 시
*/
micIcon.addEventListener("click", (e) => {
  // 마이크 버튼을 처음 눌렀을 시
  if (onRecording === false) {
    startRecording();
  } else{    
    stopRecording();
  }
});

/*
playBtn.addEventListener("click", () => {
  const storedAudio = localStorage.getItem("recorded file");

  if (storedAudio) {
    const source = document.getElementById("audioSource");
    source.src = storedAudio;
    audioPlayer.play();
  } else {
    console.error(`음성 파일 없음`);
  }
});
*/
