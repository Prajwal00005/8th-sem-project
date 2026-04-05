import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../utils/axiosConfig';
import { getInitials, getAvatarColor } from '../UI/avatar';
import { MoreVertical } from 'lucide-react';

const ChatComponent = ({ chatRoomId, username, chatRoom, fetchChatRooms }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [error, setError] = useState(null);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  // Use useCallback for fetchMessages
  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/chat/${chatRoomId}/messages/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [chatRoomId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGroupAction = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/v1/chat-rooms/${chatRoomId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      await fetchChatRooms();
      setShowMenu(false);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to perform group action');
    }
  };

  const handleBlockUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const otherUser = chatRoom.participants.find(p => p !== username);
      await axios.post(
        `/api/v1/block-user/`,
        { chat_room_id: chatRoomId, blocked_username: otherUser },
        { headers: { Authorization: `Token ${token}` } }
      );
      setShowMenu(false);
      await fetchMessages();
      await fetchChatRooms();
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error blocking user');
    }
  };

  const handleUnblockUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const otherUser = chatRoom.participants.find(p => p !== username);
      await axios.post(
        `/api/v1/unblock-user/`,
        { chat_room_id: chatRoomId, blocked_username: otherUser },
        { headers: { Authorization: `Token ${token}` } }
      );
      setShowMenu(false);
      await fetchMessages();
      await fetchChatRooms();
      setError(null);
    } catch (error) {
      setError(error.response?.data?.error || 'Error unblocking user');
    }
  };

  useEffect(() => {
    if (chatRoomId) {
      fetchMessages();
      const token = localStorage.getItem('token');
      socket.current = new WebSocket(`ws://localhost:8000/ws/chat/${chatRoomId}/?token=${token}`);
      socket.current.onopen = () => console.log('WebSocket connected');
      socket.current.onerror = (error) => console.error('WebSocket error:', error);
      socket.current.onclose = (event) => console.log('WebSocket closed:', event.code, event.reason);
      socket.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data.message]);
      };
      return () => socket.current.close();
    }
  }, [chatRoomId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageInput.trim() && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ body: messageInput }));
      setMessageInput('');
    }
  };

  const isCreator = chatRoom?.is_group && chatRoom.created_by === username;

  if (!chatRoom) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="h-full flex items-center justify-center">
          <p className="text-[#5C7361] text-base">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 bg-white border-b border-[#D8E3DC] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white
            ${getAvatarColor(chatRoom?.name)}`}>
            {getInitials(chatRoom?.name)}
          </div>
          <div>
            <h3 className="text-[#2C3B2A] font-medium text-lg">
              {chatRoom?.name || 'Unnamed Chat'}
            </h3>
            <span className="text-sm text-[#5C7361]">
              {chatRoom?.is_group ? `${chatRoom.participants.length} Members` : chatRoom.is_blocked ? 'Blocked' : 'Private Chat'}
            </span>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-[#E8EFEA] text-[#5C7361] hover:text-[#395917]"
          >
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#D8E3DC] rounded-lg shadow-lg z-50">
              <div className="py-1">
                {!chatRoom?.is_group ? (
                  <>
                    {chatRoom.blocked_by_me ? (
                      <button
                        onClick={handleUnblockUser}
                        className="block w-full text-left px-4 py-2 text-sm text-[#2C3B2A] hover:bg-[#E8EFEA]"
                      >
                        Unblock User
                      </button>
                    ) : (
                      <button
                        onClick={handleBlockUser}
                        className="block w-full text-left px-4 py-2 text-sm text-[#2C3B2A] hover:bg-[#E8EFEA]"
                      >
                        Block User
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleGroupAction}
                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-[#E8EFEA]"
                  >
                    {isCreator ? 'Delete Chat' : 'Leave Chat'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-white border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Messages Section */}
      <div className="flex-1 overflow-y-auto p-6">
        {chatRoom?.is_blocked ? (
          <div className="h-full flex items-center justify-center text-center">
            <div>
              <p className="text-[#5C7361] text-base mb-2">
                {chatRoom.blocked_by_me 
                  ? `You have blocked ${chatRoom.participants.find(p => p !== username)}. Unblock to message.` 
                  : `You cannot message ${chatRoom.participants.find(p => p !== username)} currently.`}
              </p>
              {chatRoom.blocked_by_me && (
                <button
                  onClick={handleUnblockUser}
                  className="px-4 py-2 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A]"
                >
                  Unblock
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'} mb-4`}
              >
                {msg.sender !== username && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mr-2
                    ${getAvatarColor(msg.sender)}`}>
                    {getInitials(msg.sender)}
                  </div>
                )}
                <div className={`max-w-[70%] px-4 py-2 rounded-xl
                  ${msg.sender === username 
                    ? 'bg-[#395917] text-white' 
                    : 'bg-[#F5F8F6] text-[#2C3B2A]'}`}
                >
                  {chatRoom?.is_group && msg.sender !== username && (
                    <p className="text-xs font-medium text-[#5C7361] mb-1">{msg.sender}</p>
                  )}
                  <p className="text-sm">{msg.body}</p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {!chatRoom?.is_blocked && (
        <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-[#D8E3DC]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-4 py-2 rounded-xl 
                placeholder:text-[#94A898] focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361]"
            />
            <button
              type="submit"
              disabled={!messageInput.trim()}
              className="p-2 text-[#395917] hover:text-[#2C3B2A] disabled:text-[#94A898] disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ChatComponent;