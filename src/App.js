import React, { useState, useRef } from "react";
import { saveAs } from "file-saver";
import "./SpeechToText.css";

const LANGUAGES = [
  { code: "en", name: "🇺🇸 Tiếng Anh" },
  { code: "ja", name: "🇯🇵 Tiếng Nhật" },
  { code: "ko", name: "🇰🇷 Tiếng Hàn" },
  { code: "fr", name: "🇫🇷 Tiếng Pháp" },
  { code: "de", name: "🇩🇪 Tiếng Đức" },
  { code: "zh-CN", name: "🇨🇳 Tiếng Trung (Giản thể)" },
  { code: "zh-TW", name: "🇹🇼 Tiếng Trung (Phồn thể)" },
  { code: "ru", name: "🇷🇺 Tiếng Nga" },
  { code: "es", name: "🇪🇸 Tiếng Tây Ban Nha" },
  { code: "it", name: "🇮🇹 Tiếng Ý" },
  { code: "th", name: "🇹🇭 Tiếng Thái" },
  { code: "id", name: "🇮🇩 Tiếng Indonesia" },
  { code: "ar", name: "🇸🇦 Tiếng Ả Rập" },
  { code: "hi", name: "🇮🇳 Tiếng Hindi" },
];

const SpeechToText = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const recognitionRef = useRef(null);

  const startRecording = () => {
    if (!recognitionRef.current) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => setRecording(true);
      recognition.onresult = (event) => {
        const text = event.results[event.results.length - 1][0].transcript;
        setTranscript((prev) => prev + " " + text);
      };

      recognition.onend = () => {
        if (recording) recognition.start();
        else setRecording(false);
      };

      recognitionRef.current = recognition;
    }
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  };

  const translateText = async () => {
    if (!transcript) return;
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(transcript)}&langpair=vi|${targetLang}`
      );
      const data = await response.json();
      setTranslatedText(data.responseData.translatedText);
    } catch (error) {
      console.error("Lỗi dịch:", error);
    }
  };

const downloadDoc = (content, langCode) => {
  const utf8Content = "\ufeff" + content; // Thêm BOM UTF-8
  const blob = new Blob([utf8Content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `transcript_${langCode}.docx`);
};


  return (
    <div className="wrapper">
      <div className="container">
        <h1 className="title">🎤 Nhận diện giọng nói</h1>
        <div className="button-group">
          <button className={`btn ${recording ? "stop" : "start"}`} onClick={recording ? stopRecording : startRecording}>
            {recording ? "⏹ Dừng ghi âm" : "🎙 Bắt đầu ghi âm"}
          </button>
          <button className="btn download" onClick={() => downloadDoc(transcript, "vi")} disabled={!transcript}>
            ⬇️ Tải Tiếng Việt
          </button>
          <button className="btn download" onClick={() => downloadDoc(translatedText, targetLang)} disabled={!transcript}>
              ⬇️ Tải Bản Dịch
            </button>
            
        </div>
        <div className="translation-section">
          <select className="language-select" onChange={(e) => setTargetLang(e.target.value)} value={targetLang}>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <button className="btn translate-btn" onClick={translateText} disabled={!transcript}>
            🌍 Dịch
          </button>
        </div>
        <div className="result">
          <h3>{recording ? "🔴 Đang ghi âm..." : "Kết quả:"}</h3>
          <p>{transcript || "🎧 Hãy nói để nhận diện giọng nói..."}</p>
        </div>
        {translatedText && (
          <div className="result translated">
            <h3>📖 Bản dịch:</h3>
            <p>{translatedText}</p>

          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToText;