import { parseVoiceIntent } from '../modules/voiceIntentParser.js';
import { testConnection } from '../utils/aiClient.js';

class VoiceAISystem {
  constructor() {
    this.voiceProcessor = new VoiceProcessor();
    this.taskExecutor = new TaskExecutor();
    this.isActive = false;
  } 

  async start() {
    console.log('Voice AI System Starting...');
    
    const aiConnected = await testConnection();
    if (aiConnected === "quota_exceeded") {
      console.error('AI API quota exceeded. System cannot start.');
      return false;
    }
    
    if (!aiConnected) {
      console.error('AI service unavailable. System cannot start.');
      return false;
    }
    
    console.log('AI service connected successfully');
    
    await this.voiceProcessor.initialize();
    
    this.voiceProcessor.on('speechRecognized', (text) => this.handleVoiceCommand(text));
    
    console.log('System Ready! Voice commands are being processed...');
    console.log('Supported commands:');
    console.log('- "Create a React project about e-commerce"');
    console.log('- "Create a Django blog website"');
    console.log('- "Create a Flutter mobile app for fitness"');
    console.log('- "Open Chrome browser"');
    console.log('- "Create a Word document about AI"');
    
    this.startListening();
    return true;
  }

  async handleVoiceCommand(voiceText) {
    try {
      console.log(`Voice Command: "${voiceText}"`);
      
      const intent = await parseVoiceIntent(voiceText);
      console.log(`Parsed Intent:`, intent);
      
      const result = await this.taskExecutor.execute(intent);
      console.log(`Task Completed:`, result);
      
      this.voiceProcessor.speak(result.message);
      
    } catch (error) {
      console.error('Error:', error.message);
      this.voiceProcessor.speak(`Sorry, I encountered an error: ${error.message}`);
    }
  }

  startListening() {
    this.voiceProcessor.startListening();
    this.isActive = true;
    
    // Testing with simulated voice commands
    console.log('\nTesting with simulated voice commands...');
    setTimeout(() => {
      this.voiceProcessor.processVoiceInput("create a react project about e-commerce website");
    }, 2000);
    
    setTimeout(() => {
      this.voiceProcessor.processVoiceInput("create a django blog website");
    }, 10000);
    
    setTimeout(() => {
      this.voiceProcessor.processVoiceInput("create a flutter mobile app for fitness tracking");
    }, 18000);
    
    setTimeout(() => {
      this.voiceProcessor.processVoiceInput("open chrome browser");
    }, 26000);
  }

  stop() {
    this.voiceProcessor.stopListening();
    this.isActive = false;
    console.log('Voice AI System Stopped');
  }

  async processCommand(command) {
    console.log(`Manual Command: "${command}"`);
    await this.handleVoiceCommand(command);
  }
}

if (process.argv[1].endsWith('voiceSystem.js')) {
  const system = new VoiceAISystem();
  
  system.start().then((started) => {
    if (!started) {
      console.log('System failed to start');
      process.exit(1);
    }
    
    process.on('SIGINT', () => {
      system.stop();
      process.exit(0);
    });
    
    process.stdin.setEncoding('utf8');
    console.log('\nYou can also type commands here:');
    process.stdin.on('data', (data) => {
      const command = data.trim();
      if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
        system.stop();
        process.exit(0);
      } else if (command) {
        system.processCommand(command);
      }
    });
  });
}

export default VoiceAISystem;