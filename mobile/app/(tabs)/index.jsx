import React, { useState, useEffect, useRef } from "react";
import { 
  View, Text, TouchableOpacity, TextInput, FlatList, Alert, StyleSheet 
} from "react-native";
import Voice from "react-native-voice";
import Share from "react-native-share";
import RNFS from "react-native-fs";

const LANGUAGES = [
  { code: "en", name: " 🇺🇸 English" },
  { code: "ja", name: " 🇯🇵 Japanese" },
  { code: "ko", name: " 🇰🇷 Korean" },
  { code: "fr", name: " 🇫🇷 French" },
  { code: "de", name: " 🇩🇪 German" },
  { code: "zh-CN", name: " 🇨🇳 Chinese (Simplified)" },
  { code: "zh-TW", name: " 🇹🇼 Chinese (Traditional)" },
  { code: "ru", name: " 🇷🇺 Russian" },
  { code: "es", name: " 🇪🇸 Spanish" },
  { code: "it", name: " 🇮🇹 Italian" },
  { code: "th", name: " 🇹🇭 Thai" },
  { code: "id", name: " 🇮🇩 Indonesian" },
  { code: "ar", name: " 🇸🇦 Arabic" },
  { code: "hi", name: " 🇮🇳 Hindi" },
  ];

const SpeechToText = () => {
  const [recording, setRecording] = useState(false);
  const [transcripts, setTranscripts] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [history, setHistory] = useState([]);
  const [targetLang, setTargetLang] = useState("en");
  const [recordTime, setRecordTime] = useState(0);
  let recordInterval;

  useEffect(() => {
    Voice.onSpeechResults = (e) => setTranscripts(e.value.join(" "));
    return () => Voice.destroy().then(Voice.removeAllListeners);
  }, []);

  const startRecording = async () => {
    try {
      await Voice.start("vi-VN");
      setRecording(true);
      setRecordTime(0);
      recordInterval = setInterval(() => setRecordTime((prev) => prev + 1), 1000);
    } catch (error) {
      Alert.alert("Error", "Microphone access denied");
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      clearInterval(recordInterval);
      setRecording(false);
      saveToHistory();
    } catch (error) {
      Alert.alert("Error", "Could not stop recording");
    }
  };

  const saveToHistory = () => {
    if (transcripts && !history.includes(transcripts)) {
      setHistory((prev) => [...prev, transcripts]);
    } else {
      Alert.alert("⚠️ Warning", "This record is already in history!");
    }
  };

  const translateText = async () => {
    if (!transcripts) return;
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          transcripts
        )}&langpair=vi|${targetLang}`
      );
      const data = await response.json();
      setTranslatedText(data.responseData.translatedText);
    } catch {
      Alert.alert("❌ Error", "Translation failed");
    }
  };

  const downloadText = async (content, langCode) => {
    const filePath = RNFS.DocumentDirectoryPath + `/transcript_${langCode}.txt`;
    await RNFS.writeFile(filePath, content, "utf8");
    Share.open({ url: "file://" + filePath });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎤 Speech to Text</Text>
      <TouchableOpacity
  activeOpacity={0.7}  // Giảm độ nhạy touch
  style={[styles.button, recording ? styles.stopButton : styles.startButton]}
  onPress={recording ? stopRecording : startRecording}
>
  <Text style={styles.buttonText}>
    {recording ? `⏹ STOP (${recordTime}s)` : "🎙 START RECORD"}
  </Text>
</TouchableOpacity>


      <TextInput
        style={styles.input}
        value={transcripts}
        placeholder="Recognized speech will appear here..."
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={translateText} disabled={!transcripts}>
        <Text style={styles.buttonText}>🌍 Translate</Text>
      </TouchableOpacity>

      {translatedText ? (
        <TextInput style={styles.input} value={translatedText} multiline />
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={() => downloadText(transcripts, "vi")}
        disabled={!transcripts}
      >
        <Text style={styles.buttonText}>⬇️ Download Original</Text>
      </TouchableOpacity>

      {history.length > 0 && (
        <FlatList
          data={history}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <Text style={styles.historyItem} onPress={() => setTranscripts(item)}>{item}</Text>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 5,
  },
  startButton: { backgroundColor: "#28a745" },
  stopButton: { backgroundColor: "#dc3545" },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    minHeight: 100,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  historyItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default SpeechToText;
