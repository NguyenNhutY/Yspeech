import React, { useState, useRef, useCallback, useMemo } from "react";
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
  const [isDeleted, setIsDeleted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcripts, setTranscripts] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [copiedSection, setCopiedSection] = useState(""); // Đánh dấu phần nào đã sao chép
  const recognitionRef = useRef(null);
  const [history, setHistory] = useState([]); // Lịch sử bản ghi
  const [deletedTranscript, setDeletedTranscript] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [recordTime, setRecordTime] = useState(0);
  let recordInterval;

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2000);
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = "vi-VN";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setRecording(true);
        setRecordTime(0);
        recordInterval = setInterval(() => {
          setRecordTime(prev => prev + 1);
        }, 1000);
      };
      recognition.onresult = (event) => {
        const text = event.results[event.results.length - 1][0].transcript;
        setTranscripts((prev) => (prev ? `${prev} ${text}` : text)); // Ghép văn bản mới vào văn bản cũ
      };

      recognition.onend = () => {
        clearInterval(recordInterval);

        if (recording) recognition.start();
        else setRecording(false);
      };

      recognitionRef.current = recognition;
    }
    recognitionRef.current.start();
  };
  const deleteHistoryItem = (index) => {
    setHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
      saveToHistory(); // Tự động lưu lịch sử khi dừng ghi âm

    }
  };


  
  const undoDelete = () => {
    if (deletedTranscript) {
      setTranscripts(deletedTranscript);
      setDeletedTranscript(null);
    }
  };

  const saveToHistory = () => {
    if (transcripts && !history.includes(transcripts)) {
      setHistory((prev) => [...prev, transcripts]);
    } else {
      showToast("⚠️ Bản ghi đã có trong lịch sử!");
    }
  };
  

  const restoreFromHistory = (item) => {
    setTranscripts(item);
  };

  const translateText = async () => {
    if (!transcripts) return;
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(transcripts)}&langpair=vi|${targetLang}`
      );
      const data = await response.json();
      setTranslatedText(data.responseData.translatedText);
      showToast("✅ Dịch thành công!");
    } catch {
      showToast("❌ Lỗi khi dịch!");
    }
  };


  const downloadDoc = (content, langCode) => {
    const utf8Content = "\ufeff" + content;
    const blob = new Blob([utf8Content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `transcript_${langCode}.docx`);
    showToast("📥 Tải xuống thành công!");
  };

  const clearTranscripts = () => {
    setTranscripts("");
    setTranslatedText("");
  
  };

  const deleteLastTranscript = () => {
    if (!transcripts) return;
    const transcriptArray = transcripts.split(" ");
    transcriptArray.pop(); // Xóa từ cuối cùng
    setTranscripts(transcriptArray.join(" "));
    setIsDeleted(true); // Hiện màu đỏ khi xóa
    setDeletedTranscript(transcripts);

    setTimeout(() => setIsDeleted(false), 2000); // Reset màu sau 2s
  };

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(""), 2000);
    });
  };

  

  return (
    <div className="wrapper">
      <div className="container">
        <h1 className="title">🎤 YOUR SPEECH YOUR TEXT</h1>
        <div className="button-group">
        <button
  className={`btn ${recording ? "stop" : "start"}`}
  onClick={recording ? stopRecording : startRecording}
>
  {recording ? `⏹ STOP RECORD (${recordTime}s)` : "🎙START RECORD"}
</button>

          <button className="btn save" onClick={saveToHistory} disabled={!transcripts}>
            💾 SAVE
          </button>
          <button className="btn undo" onClick={undoDelete} disabled={!deletedTranscript}>
            ↩️ BACK
          </button>
          <button className="btn clear" onClick={clearTranscripts} disabled={!transcripts}>
            🗑️ CLEAN
          </button>
          <button className="btn download" onClick={() => downloadDoc(transcripts, "vi")} disabled={!transcripts}>
            ⬇️ DOWNL ORIGINAL TEXT
          </button>
          <button className="btn download" onClick={() => downloadDoc(translatedText, targetLang)} disabled={!translatedText}>
            ⬇️ DOWNL TRANSCRIPT TEXT
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
          <button className="btn translate-btn" onClick={translateText} disabled={!transcripts}>
            🌍 TRANSCRIPT
          </button>
        </div>

        <div
    className={`result ${isDeleted ? "deleted" : ""}`}
    style={{
      cursor: transcripts ? "pointer" : "default",
      backgroundColor: copiedSection === "transcripts" && transcripts ? "lightgreen" : "",
    }}
    onClick={() => transcripts && copyToClipboard(transcripts, "transcripts")}
  >
    <h3>{recording ? "🔴 RECORDING..." : "RESULT:"}</h3>
    {transcripts ? (
      <>
        <p>{transcripts}</p>
        <button className="btn delete" onClick={deleteLastTranscript}>🗑️ DELETE</button>
      </>
    ) : (
      <p>🎧 Pls Speak for voice recognition....</p>
    )}
  </div>

        {translatedText && (
          <div
            className="result translated"
            style={{ cursor: "pointer", backgroundColor: copiedSection === "translatedText" ? "lightgreen" : "" }}
            onClick={() => copyToClipboard(translatedText, "translatedText")}
          >
            <h3>📖 TRANSLATED TEXTTEXT:</h3>
            <p>{translatedText}</p>
          </div>
        )}
{history.length > 0 && (
  <div className="history">
    <h3>📜 RECORD HISTORYHISTORY:</h3>
    <ul>
      {history.map((item, index) => (
        <li key={index}>
          <span onClick={() => restoreFromHistory(item)}>{item}</span>
          <button className="btn delete-btn" onClick={() => deleteHistoryItem(index)}>🗑️</button>
        </li>
      ))}
    </ul>
    </div>
)}

      </div>
      {toastMessage && <div className="toast">{toastMessage}</div>}

    </div>
  );
};

export default SpeechToText;
