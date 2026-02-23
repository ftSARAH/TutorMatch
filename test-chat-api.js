// Test script to verify chat API functionality
// Run this in the browser console when logged in

const testChatAPI = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('Please login first to get a token');
    return;
  }

  try {
    console.log('Testing chat API...');
    
    // Test getting available users
    console.log('1. Testing /chat/users endpoint...');
    const usersResponse = await fetch('/api/chat/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const users = await usersResponse.json();
    console.log('Available users response:', users);
    
    if (users.success && users.users.length > 0) {
      console.log('2. Testing conversation creation...');
      
      // Get current user info from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentUserId = payload.userId;
      
      console.log('Current user ID from token:', currentUserId);
      console.log('First available user:', users.users[0]);
      
      // Test creating a conversation
      const conversationResponse = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participants: [
            { userId: currentUserId, role: payload.role },
            { userId: users.users[0]._id, role: users.users[0].role }
          ],
          chatType: 'direct'
        })
      });
      
      const conversation = await conversationResponse.json();
      console.log('Create conversation response:', conversation);
      
      if (conversation.success) {
        console.log('✅ Chat API test successful!');
        console.log('Conversation created:', conversation.conversation);
      } else {
        console.log('❌ Chat API test failed:', conversation.message);
      }
    } else {
      console.log('❌ No users available to test with');
    }
    
  } catch (error) {
    console.error('❌ Chat API test failed:', error);
  }
};

// Run the test
testChatAPI();

