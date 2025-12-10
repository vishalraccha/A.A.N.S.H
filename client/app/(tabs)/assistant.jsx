import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { sendCommandToBackend } from "../../api/apiService";

// 🔹 Animated Loading Bubble
const LoadingBubble = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const animateDot = (dot, delay) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot, {
          toValue: -5,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  return (
    <View style={styles.loadingBubble}>
      <Animated.Text style={[styles.loadingDot, { transform: [{ translateY: dot1 }] }]}>●</Animated.Text>
      <Animated.Text style={[styles.loadingDot, { transform: [{ translateY: dot2 }] }]}>●</Animated.Text>
      <Animated.Text style={[styles.loadingDot, { transform: [{ translateY: dot3 }] }]}>●</Animated.Text>
    </View>
  );
};

export default function Assistant() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello!", sender: "user" },
    { id: 2, text: "Hi Vishal 👋, how can I help you today?", sender: "bot" },
  ]);
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef();

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, isTyping]);

const sendMessage = async () => {
  if (!input.trim() || isTyping) return;

  const userMessage = input.trim();
  const userMsg = { id: Date.now(), text: userMessage, sender: "user" };
  
  setMessages((prev) => [...prev, userMsg]);
  setInput("");
  setIsTyping(true);

  try {
    // Call backend API
    const response = await sendCommandToBackend(userMessage);

    // ✅ Always display AI response from `response.content`
    const botMsg = {
      id: Date.now() + 1,
      text:
        response?.content ??
        response?.data?.content ??
        response?.response ??
        "Command executed successfully!",
      sender: "bot",
    };
    
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
    
  } catch (error) {
    console.error("❌ Error:", error);
    
    let errorMessage = "Sorry, I encountered an error. Please try again.";
    
    if (error.message === "Network Error") {
      errorMessage = "⚠️ Cannot connect to backend server. Please ensure the server is running on http://localhost:5000";
    } else if (error.response) {
      errorMessage = `Error: ${error.response.data.error || error.response.data.message || "Something went wrong"}`;
    } else if (error.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    const errorMsg = {
      id: Date.now() + 1,
      text: errorMessage,
      sender: "bot",
    };
    
    setMessages((prev) => [...prev, errorMsg]);
    setIsTyping(false);
    
    // Show alert for network errors
    if (error.message === "Network Error") {
      Alert.alert(
        "Connection Error",
        "Cannot connect to the backend server. Please check if:\n\n1. Backend server is running\n2. Server is accessible at http://localhost:5000\n3. CORS is properly configured",
        [{ text: "OK" }]
      );
    }
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity>
            <Icon name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>AANSH ASSISTANT</Text>
          <TouchableOpacity>
            <Icon name="more-vert" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Chat Section */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.message,
                msg.sender === "user" ? styles.userMsg : styles.botMsg,
              ]}
            >
              <Text style={styles.msgText}>{msg.text}</Text>
            </View>
          ))}
          
          {/* Loading indicator */}
          {isTyping && (
            <View style={[styles.message, styles.botMsg]}>
              <LoadingBubble />
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask Aansh to do something..."
              placeholderTextColor="#666"
              value={input}
              onChangeText={setInput}
              maxLength={1000}
              onSubmitEditing={sendMessage}
              editable={!isTyping}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                input.trim() && !isTyping ? styles.sendButtonActive : styles.sendButtonInactive
              ]} 
              onPress={sendMessage}
              disabled={!input.trim() || isTyping}
            >
              <Icon 
                name="send" 
                size={24} 
                color={input.trim() && !isTyping ? "#fff" : "#888"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0a0a0f",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 2,
    borderBottomColor: "#00f0ff20",
    shadowColor: "#00f0ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerText: { 
    color: "#00f0ff", 
    fontSize: 20, 
    fontWeight: "700",
    letterSpacing: 2,
    textShadowColor: "#00f0ff40",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  chat: { 
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  chatContent: { 
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  message: {
    padding: 14,
    borderRadius: 18,
    marginVertical: 6,
    maxWidth: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userMsg: { 
    backgroundColor: "#02bd8b",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    marginLeft: 40,
  },
  botMsg: { 
    backgroundColor: "#262626", 
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: "#00f0ff15",
    marginRight: 40,
  },
  msgText: { 
    color: "#ffffff", 
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 86,
    
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",      // vertically center children
    justifyContent: "center",  // ensure content centers horizontally when possible
    borderRadius: 30,
    paddingHorizontal: 10,
    paddingVertical: 6,        // keeps the bar height consistent
    minHeight: 50,             // ensures enough vertical space to center text
    borderWidth: 2,
    borderColor: "#02bd8b",
    shadowColor: "#02bd8b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  
  input: { 
    flex: 1, 
    color: "#ffffff", 
    fontSize: 15,
    marginRight: 12,
    borderRadius: 20,
    height: 40,
    backgroundColor: "#141414",
    paddingHorizontal: 14,
    textAlignVertical: "center",       // important: centers text/placeholder vertically (Android)
    paddingVertical: Platform.OS === 'ios' ? 10 : 6, // adjust for iOS/Android vertical centering
    letterSpacing: 0.3,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#027d5c",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonActive: {
    backgroundColor: "#02bd8b",
  },
  sendButtonInactive: {
    backgroundColor: "#333350",
  },
  loadingBubble: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 24,
    paddingVertical: 4,
  },
  loadingDot: {
    color: "#00f0ff",
    fontSize: 16,
    marginHorizontal: 3,
    opacity: 0.9,
  },
});
