// Test script to verify the user ID fix
// Run this in the browser console after logging in

const testUserIDFix = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  if (!token || !userData) {
    console.log('Please login first');
    return;
  }
  
  try {
    const user = JSON.parse(userData);
    console.log('User data from localStorage:', user);
    console.log('User ID field:', user._id || user.id);
    console.log('Is _id valid MongoDB ObjectId?', /^[0-9a-fA-F]{24}$/.test(user._id || ''));
    console.log('Is id valid MongoDB ObjectId?', /^[0-9a-fA-F]{24}$/.test(user.id || ''));
    
    // Test the getUserId helper function
    const getUserId = (user) => {
      return user?._id || user?.id;
    };
    
    const userId = getUserId(user);
    console.log('Extracted user ID:', userId);
    console.log('Is extracted ID valid?', /^[0-9a-fA-F]{24}$/.test(userId || ''));
    
    if (/^[0-9a-fA-F]{24}$/.test(userId || '')) {
      console.log('✅ User ID fix successful!');
    } else {
      console.log('❌ User ID still invalid. You may need to logout and login again.');
    }
    
  } catch (error) {
    console.error('Error testing user ID:', error);
  }
};

// Run the test
testUserIDFix();

