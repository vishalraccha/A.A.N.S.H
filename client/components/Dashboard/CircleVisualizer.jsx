import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { Mic, Square } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CircleVisualizer = () => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(null);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const recognitionRef = useRef(null);
  const isWeb = Platform.OS === "web";

  // ======================================================
  // 🔊 PROCESS COMMAND - FIXED VERSION
  // ======================================================
  const handleCommand = async (command) => {
    if (!command || command.trim() === "") {
      console.log("Empty command, skipping...");
      return;
    }

    const cleanCommand = command.trim();
    setText(cleanCommand);
    console.log("📤 Sending command:", cleanCommand);

    try {
      // ⚠️ CHANGE THIS IP TO YOUR BACKEND IP ADDRESS
      const BACKEND_URL = "http://10.202.153.140:5000/runCommand";

      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          command: cleanCommand,
          isAudio: false,
        }),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Response data:", data);

      // Extract the message to speak
      let message = "";

      if (data.success) {
        // Command succeeded
        message = data.message || data.output || "Command executed successfully";
      } else {
        // Command failed
        message = data.message || data.error || "Command execution failed";
      }

      console.log("🔊 Speaking:", message);

      // Speak the response
      if (isWeb && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        const utter = new SpeechSynthesisUtterance(message);
        utter.lang = "en-US";
        utter.rate = 1;
        utter.pitch = 1;
        window.speechSynthesis.speak(utter);
      } else {
        await Speech.stop(); // Stop any ongoing speech
        Speech.speak(message, {
          language: "en-US",
          pitch: 1,
          rate: 1,
        });
      }
    } catch (error) {
      console.error("❌ Error processing command:", error);
      const errorMsg = `Error: ${error.message}. Please check your backend connection.`;

      if (isWeb && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(errorMsg);
        window.speechSynthesis.speak(utter);
      } else {
        Speech.speak(errorMsg);
      }
    }
  };

  // ======================================================
  // 💻 WEB SPEECH RECOGNITION (Browser)
  // ======================================================
  const startWebListening = () => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        Alert.alert(
          "Not Supported",
          "Speech recognition is not available in this browser. Please use Chrome, Edge, or Safari."
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("🎧 Web speech started");
        setIsListening(true);
      };

      recognition.onresult = async (event) => {
        const command = event.results[0][0].transcript;
        console.log("🎙️ Web recognized:", command);
        setIsListening(false);
        await handleCommand(command);
      };

      recognition.onerror = (event) => {
        console.error("Web Speech Error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed") {
          Alert.alert("Permission Denied", "Please allow microphone access");
        } else if (event.error === "no-speech") {
          if (window.speechSynthesis) {
            const utter = new SpeechSynthesisUtterance(
              "I didn't hear anything. Please try again."
            );
            window.speechSynthesis.speak(utter);
          }
        } else if (event.error !== "aborted") {
          if (window.speechSynthesis) {
            const utter = new SpeechSynthesisUtterance(
              "Something went wrong. Please try again."
            );
            window.speechSynthesis.speak(utter);
          }
        }
      };

      recognition.onend = () => {
        console.log("🎧 Web speech ended");
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Web speech error:", err);
      setIsListening(false);
      Alert.alert("Error", "Failed to start speech recognition");
    }
  };

  const stopWebListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.log("Recognition already stopped");
      }
    }
  };

  // ======================================================
  // 📱 MOBILE AUDIO RECORDING (Expo Go Compatible)
  // ======================================================
  const startMobileRecording = async () => {
    try {
      // Don't start if already recording
      if (isRecordingActive) {
        console.log("Already recording, skipping...");
        return;
      }

      // Request microphone permission
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please enable microphone permissions to use voice commands"
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      setIsListening(true);
      setIsRecordingActive(true);
      console.log("📱 Mobile recording started");

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      setRecording(newRecording);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsListening(false);
      setIsRecordingActive(false);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  const stopMobileRecording = async () => {
    if (!recording || !isRecordingActive) {
      console.log("No active recording to stop");
      return;
    }

    try {
      console.log("📱 Stopping recording...");

      // Check if recording is still valid
      const status = await recording.getStatusAsync();

      if (status.canRecord || status.isRecording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        setIsListening(false);
        setRecording(null);
        setIsRecordingActive(false);

        if (uri) {
          console.log("📱 Recording saved, sending to backend...");
          await sendAudioToBackend(uri);
        }
      } else {
        console.log("Recording already stopped");
        setIsListening(false);
        setRecording(null);
        setIsRecordingActive(false);
      }
    } catch (err) {
      console.error("Failed to stop recording:", err);
      setIsListening(false);
      setRecording(null);
      setIsRecordingActive(false);
      Alert.alert("Error", "Failed to process recording");
    }
  };

  // ======================================================
  // 📤 SEND AUDIO TO BACKEND (Mobile Only) - FIXED VERSION
  // ======================================================
  const sendAudioToBackend = async (audioUri) => {
    try {
      console.log("📤 Processing audio file:", audioUri);
      
      let base64Audio;
      
      if (Platform.OS === 'web') {
        const response = await fetch(audioUri);
        const blob = await response.blob();
        base64Audio = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        // Using new FileSystem API
        try {
          const file = await FileSystem.File.fromURI(audioUri);
          if (!file) {
            throw new Error('Audio file not found');
          }
          
          // Read the file content as base64
          base64Audio = await file.readAsBase64();
        } catch (fileError) {
          console.warn("New API failed, falling back to legacy API:", fileError);
          // Fallback to legacy API if needed
          base64Audio = await FileSystem.readAsStringAsync(audioUri, {
            encoding: FileSystem.EncodingType.Base64
          });
        }
      }

      if (!base64Audio) {
        throw new Error('Failed to encode audio file');
      }

      console.log("📤 Sending audio to backend...");
      
      const BACKEND_URL = "http://10.202.153.140:5000/api/audio";
      
      const response = await axios.post(BACKEND_URL, {
        audio: base64Audio,
        timestamp: new Date().toISOString()
      });

      console.log("📥 Backend response:", response.data);
      
      if (response.data?.command) {
        await handleCommand(response.data.command);
      }

    } catch (error) {
      console.error("❌ Error processing audio:", error);
      Alert.alert(
        "Error",
        "Failed to process audio. Please try again."
      );
    } finally {
      // Cleanup using new FileSystem API
      try {
        if (Platform.OS !== 'web' && audioUri) {
          const file = await FileSystem.File.fromURI(audioUri);
          await file.delete();
        }
      } catch (e) {
        console.warn("Failed to cleanup audio file:", e);
      }
    }
  };

  // ======================================================
  // 🎯 UNIFIED BUTTON HANDLER
  // ======================================================
  const handlePress = async () => {
    if (isWeb) {
      // WEB: Use browser speech recognition
      if (isListening) {
        stopWebListening();
      } else {
        startWebListening();
      }
    } else {
      // MOBILE: Use audio recording
      if (isListening) {
        await stopMobileRecording();
      } else {
        await startMobileRecording();
      }
    }
  };

  // ======================================================
  // 🧹 CLEANUP
  // ======================================================
  useEffect(() => {
    return () => {
      // Cleanup web recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log("Recognition cleanup completed");
        }
      }

      // Cleanup mobile recording
      if (recording && isRecordingActive) {
        (async () => {
          try {
            const status = await recording.getStatusAsync();
            if (status.canRecord || status.isRecording) {
              await recording.stopAndUnloadAsync();
            }
          } catch (err) {
            console.log("Recording cleanup completed");
          }
        })();
      }
    };
  }, [recording, isRecordingActive]);

  // ======================================================
  // ✨ ANIMATIONS
  // ======================================================
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isListening]);

  // ======================================================
  // 🎨 UI
  // ======================================================
  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      {/* Outer Glow */}
      {isListening && (
        <>
          <Animated.View
            style={[
              styles.outerGlow,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.4],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.outerGlow2,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.25],
                }),
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}

      {/* Main Orb */}
      <Animated.View
        style={[styles.orbWrapper, { transform: [{ scale: pulseAnim }] }]}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
          <LinearGradient
            colors={
              isListening
                ? ["#02BD8B", "#01E5A8", "#02BD8B"]
                : ["#02BD8B", "#029872", "#02BD8B"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.orb, isListening && styles.activeOrb]}
          >
            <View style={styles.glassLayer}>
              <LinearGradient
                colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0.05)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.glassGradient}
              />
            </View>

            <View style={styles.innerContent}>
              {isListening && !isWeb ? (
                <Square size={56} color="white" strokeWidth={2.5} />
              ) : (
                <Mic size={56} color="white" strokeWidth={2.5} />
              )}
              <Text style={styles.orbText}>
                {isListening
                  ? isWeb
                    ? "Listening..."
                    : "Tap to Stop"
                  : "Tap to Speak"}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Status Text */}
      <Text style={styles.statusText}>
        {isListening ? "🎤 Speak now..." : "Ask Aansh"}
      </Text>

      {/* Mobile Hint */}
      {!isWeb && (
        <Text style={styles.hintText}>
          Tap to record, speak, then tap again to send
        </Text>
      )}

      {/* Transcript */}
      {text ? (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>You said:</Text>
          <Text style={styles.transcriptText}>{text}</Text>
        </View>
      ) : null}
    </View>
  );
};

export default CircleVisualizer;

// 💅 Styles
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  outerGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#02BD8B",
  },
  outerGlow2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#02BD8B",
  },
  orbWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  orb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#02BD8B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  activeOrb: {
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 18,
  },
  glassLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 110,
    overflow: "hidden",
  },
  glassGradient: {
    width: "100%",
    height: "45%",
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
  },
  innerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
  statusText: {
    marginTop: 16,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
  hintText: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontStyle: "italic",
  },
  transcriptBox: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(2,189,139,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2,189,139,0.25)",
    maxWidth: "85%",
  },
  transcriptLabel: {
    fontSize: 11,
    color: "#02BD8B",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  transcriptText: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
  },
});