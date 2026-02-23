import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Plus, 
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock
} from 'lucide-react';
import apiClient from '../utils/api.js';

const Chat = ({ currentUser }) => {
  console.log('Chat component received currentUser:', currentUser);
  
  // Helper function to validate MongoDB ObjectId
  const isValidObjectId = (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  };
  
  // Helper function to get user ID (handle both id and _id)
  const getUserId = (user) => {
    return user?._id || user?.id;
  };
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await apiClient.get('/chat/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch available users to chat with
  const fetchAvailableUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching available users...');
      const response = await apiClient.get('/chat/users');
      console.log('Available users response:', response.data);
      if (response.data.success) {
        setAvailableUsers(response.data.users);
        console.log('Set available users:', response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (chatId) => {
    try {
      const response = await apiClient.get(`/chat/conversations/${chatId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    try {
      const response = await apiClient.post(`/chat/conversations/${selectedConversation._id}/messages`, {
        content: newMessage.trim(),
        messageType: 'text'
      });

      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        // Update conversation list with new last message
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Create new conversation
  const createConversation = async (userId, userRole) => {
    try {
      const currentUserId = getUserId(currentUser);
      console.log('Creating conversation with:', { userId, userRole, currentUserId });
      
      // Validate user IDs
      if (!userId || !currentUserId) {
        throw new Error('Invalid user IDs');
      }
      
      // Validate ObjectId format
      if (!isValidObjectId(userId) || !isValidObjectId(currentUserId)) {
        throw new Error('Invalid user ID format');
      }
      
      const response = await apiClient.post('/chat/conversations', {
        participants: [
          { userId: currentUserId, role: currentUser.role },
          { userId, role: userRole }
        ],
        chatType: 'direct'
      });

      console.log('Create conversation response:', response.data);

      if (response.data.success) {
        const conversation = response.data.conversation;
        setConversations(prev => [conversation, ...prev]);
        setSelectedConversation(conversation);
        setMessages([]);
        setShowNewChat(false);
        fetchMessages(conversation._id);
      } else {
        console.error('Create conversation failed:', response.data);
        alert(`Failed to create conversation: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create conversation. Please try again.';
      alert(`Error: ${errorMessage}`);
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation._id);
  };

  // Handle key press for sending message
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Poll for new messages
  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        fetchMessages(selectedConversation._id);
        fetchConversations();
      }, 3000); // Poll every 3 seconds

      setPollingInterval(interval);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [selectedConversation]);

  // Initial data fetch
  useEffect(() => {
    fetchConversations();
    fetchAvailableUsers();
  }, []);

  // Fetch users when modal opens
  useEffect(() => {
    if (showNewChat) {
      fetchAvailableUsers();
    }
  }, [showNewChat]);

  // Refresh user data from localStorage
  const refreshUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Refreshed user data:', parsedUser);
        // Update the current user data if needed
        if (parsedUser._id || parsedUser.id) {
          console.log('User ID found:', parsedUser._id || parsedUser.id);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get other participant name
  const getOtherParticipant = (conversation) => {
    const otherParticipant = conversation.participants.find(
      p => getUserId(p.user) !== getUserId(currentUser)
    );
    return otherParticipant?.user;
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    const otherUser = getOtherParticipant(conversation);
    return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Filter available users based on search
  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex bg-gray-50">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const otherUser = getOtherParticipant(conversation);
            const isSelected = selectedConversation?._id === conversation._id;
            
            return (
              <div
                key={conversation._id}
                onClick={() => handleConversationSelect(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {otherUser?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {otherUser?.name || 'Unknown User'}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {conversation.lastMessage?.timestamp ? 
                        formatTime(conversation.lastMessage.timestamp) : ''}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getOtherParticipant(selectedConversation)?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {getOtherParticipant(selectedConversation)?.name || 'Unknown User'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getOtherParticipant(selectedConversation)?.role || 'User'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <Video className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = getUserId(message.sender) === getUserId(currentUser);
                const isRead = message.readBy.some(read => getUserId(read.user) !== getUserId(currentUser));
                
                return (
                  <div
                    key={message._id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          <div className="ml-1">
                            {isRead ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                  <Paperclip className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendingMessage}
                  />
                  <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700">
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingMessage ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500">Choose a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Start New Chat</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={fetchAvailableUsers}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Refresh users"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Search in modal */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Debug info */}
              <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Debug Information</span>
                  <button
                    onClick={refreshUserData}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    Refresh User Data
                  </button>
                </div>
                <p>Current User: {currentUser?.name} ({currentUser?.role})</p>
                <p>Current User ID: {getUserId(currentUser)} (Valid: {isValidObjectId(getUserId(currentUser)) ? 'Yes' : 'No'})</p>
                <p>Available Users: {availableUsers.length}</p>
                <p>Filtered Users: {filteredUsers.length}</p>
                {filteredUsers.map((user, index) => (
                  <p key={index}>User {index + 1}: {user.name} - ID: {getUserId(user)} (Valid: {isValidObjectId(getUserId(user)) ? 'Yes' : 'No'})</p>
                ))}
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600">Loading users...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No users available to chat with</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {searchTerm ? 'Try a different search term' : 'All available users are already in conversations'}
                      </p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      console.log('Rendering user:', user);
                      return (
                        <div
                          key={user._id}
                          onClick={() => {
                            console.log('User clicked:', user);
                            createConversation(user._id, user.role);
                          }}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
