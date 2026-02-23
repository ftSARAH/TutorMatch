// Test script to verify chat functionality
// This can be run in the browser console to test the chat API

const testChatAPI = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('Please login first to get a token');
    return;
  }

  try {
    // Test getting conversations
    console.log('Testing chat API...');
    
    const conversationsResponse = await fetch('/api/chat/conversations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const conversations = await conversationsResponse.json();
    console.log('Conversations:', conversations);
    
    // Test getting available users
    const usersResponse = await fetch('/api/chat/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const users = await usersResponse.json();
    console.log('Available users:', users);
    
    console.log('Chat API test completed successfully!');
  } catch (error) {
    console.error('Chat API test failed:', error);
  }
};

// Run the test
testChatAPI();

