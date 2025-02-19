const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'vi-VN'; // Hỗ trợ tiếng Việt
recognition.continuous = true;
recognition.interimResults = false;

recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
    }
    console.log(transcript);
    saveToWord(transcript);
};

recognition.start();

function saveToWord(text) {
    const blob = new Blob([text], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "speech-to-text.docx";
    link.click();
}
