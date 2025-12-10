import ngrok from 'ngrok';

async function testNewToken() {
  try {
    console.log('🧪 Testing new token...');
    
    const url = await ngrok.connect({
      addr: 5000,
      authtoken: '32kEqB7BE9T1iE4HJHwHNZoledx_2VynEbr9qTmXq1zpF9e8r', // Paste new token directly for testing
      region: 'us'
    });
    
    console.log('✅ SUCCESS! New token works:', url);
    await ngrok.kill();
    
  } catch (error) {
    console.log('❌ New token also failed:', error.message);
    console.log('💡 Try using LocalTunnel instead');
  }
}

testNewToken();