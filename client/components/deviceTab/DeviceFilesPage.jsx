import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert,
  TextInput,
  TouchableOpacity,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from "@expo/vector-icons"

const DeviceFilesPage = ({ onBack }) => {
  const [ngrokUrl, setNgrokUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenBrowser = async () => {
    let urlToOpen = ngrokUrl.trim();
    
    if (!urlToOpen) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Ensure URL has proper protocol
    if (!urlToOpen.startsWith('http')) {
      urlToOpen = 'https://' + urlToOpen;
    }

    // Validate URL format
    try {
      new URL(urlToOpen);
    } catch (error) {
      Alert.alert('Invalid URL', 'Please enter a valid URL format');
      return;
    }

    setIsLoading(true);

    try {
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(urlToOpen);
      
      if (canOpen) {
        // Open the URL in default browser
        await Linking.openURL(urlToOpen);
      } else {
        Alert.alert('Error', 'Cannot open this URL on your device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open URL. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (url) => {
    setNgrokUrl(url);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#f1f5f9" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>📁 Remote File Browser</Text>
            <Text style={styles.subtitle}>
              Access your computer files from mobile
            </Text>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter Server URL:</Text>
          <TextInput
            style={styles.input}
            placeholder="https://abc-123-456.ngrok.io"
            placeholderTextColor="#666"
            value={ngrokUrl}
            onChangeText={setNgrokUrl}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="url"
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={handleOpenBrowser}
          />
          
          <Text style={styles.helpText}>
            Paste the ngrok URL from your server terminal
          </Text>

          {/* Quick Fill Buttons */}
          <View style={styles.quickFillContainer}>
            <Text style={styles.quickFillLabel}>Quick Fill:</Text>
            <View style={styles.quickFillButtons}>
              <TouchableOpacity 
                style={styles.quickFillButton}
                onPress={() => handleQuickFill('https://')}
              >
                <Text style={styles.quickFillText}>https://</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickFillButton}
                onPress={() => handleQuickFill('.ngrok.io')}
              >
                <Text style={styles.quickFillText}>.ngrok.io</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.quickFillButton}
                onPress={() => handleQuickFill('.loca.lt')}
              >
                <Text style={styles.quickFillText}>.loca.lt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.openButton, 
            (!ngrokUrl || isLoading) && styles.openButtonDisabled
          ]} 
          onPress={handleOpenBrowser}
          disabled={!ngrokUrl || isLoading}
        >
          <Text style={styles.openButtonText}>
            {isLoading ? '🔄 Opening...' : '🌐 Open in Browser'}
          </Text>
        </TouchableOpacity>

        <View style={styles.instructionsContainer}>
          <View style={styles.featuresBox}>
            <Text style={styles.featuresTitle}>Features Available:</Text>
            <Text style={styles.featuresText}>✅ View files and folders</Text>
            <Text style={styles.featuresText}>✅ Download files</Text>
            <Text style={styles.featuresText}>✅ Upload files from mobile</Text>
            <Text style={styles.featuresText}>✅ Delete files and folders</Text>
            <Text style={styles.featuresText}>✅ Image, PDF, and video preview</Text>
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteTitle}>💡 Note:</Text>
            <Text style={styles.noteText}>
              This will open your file browser in your device's default web browser. 
              All file operations will work seamlessly.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    marginTop: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e90ff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1c23',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#2a2d38',
    marginBottom: 8,
  },
  helpText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  quickFillContainer: {
    marginTop: 10,
  },
  quickFillLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  quickFillButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFillButton: {
    backgroundColor: '#2a2d38',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3d48',
  },
  quickFillText: {
    color: '#1e90ff',
    fontSize: 12,
    fontWeight: '500',
  },
  openButton: {
    backgroundColor: '#1e90ff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  openButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    gap: 20,
  },
  featuresBox: {
    backgroundColor: '#1a1c23',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  featuresTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featuresText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  noteBox: {
    backgroundColor: '#2a2d38',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  noteTitle: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noteText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DeviceFilesPage;