import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../utils/axiosConfig';
import ChatComponent from './chatComponent';
import { getInitials, getAvatarColor } from '../UI/avatar';
import AlertMessage from '../UI/alertMessage';
import { X } from 'lucide-react';

const ChatSection = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [residents, setResidents] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [renameChatId, setRenameChatId] = useState(null);
  const [newChatName, setNewChatName] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('chats');
  const username = localStorage.getItem('username');
  const apartmentName = localStorage.getItem('apartmentName');

  const filteredResidents = residents.filter(r => 
    r.id && 
    r.username && 
    typeof r.username === 'string' && 
    !r.name && 
    r.username.toLowerCase().includes(searchQuery.toLowerCase()) && 
    r.username !== username
  );

  const fetchChatRooms = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/v1/chat-rooms/', {
        headers: { Authorization: `Token ${token}` },
      });
      
      const uniqueRooms = Array.from(
        new Map(response.data.map(room => [room.id, room])).values()
      );

      const updatedRooms = uniqueRooms.map(room => {
        if (!room.is_group) {
          const otherParticipant = room.participants.find(p => p !== username) || room.left_by;
          return { ...room, name: room.custom_name || otherParticipant || `Private ${room.id}` };
        }
        return { ...room, name: room.custom_name || room.name || `Group ${room.id}` };
      });
      
      setChatRooms(updatedRooms);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch chat rooms');
    }
  }, [username]);

  const fetchResidents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/v1/residents/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setResidents(response.data);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to fetch residents');
    }
  }, []);

  const handleCreateChat = useCallback(async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const isGroup = selectedUsers.length > 1;
      const endpoint = isGroup ? '/api/v1/create-group-chat/' : '/api/v1/create-private-chat/';
      const payload = isGroup 
        ? { apartment_name: apartmentName, name: newChatName || `${username}'s Group`, participants: selectedUsers }
        : { other_username: residents.find(r => r.id === selectedUsers[0]).username };
      
      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      await fetchChatRooms();
      setSelectedChatRoom(response.data.id);
      setSelectedUsers([]);
      setSearchQuery('');
      setNewChatName('');
      setError(null);
      setActiveTab('chats');
    } catch (error) {
      const isGroup = selectedUsers.length > 1;
      if (error.response?.status === 409 && isGroup) {
        setError('Group with this name already exists');
        setSelectedChatRoom(error.response.data.id);
        setSelectedUsers([]);
        setSearchQuery('');
        setNewChatName('');
        setActiveTab('chats');
      } else {
        setError(error.response?.data?.detail || 'Failed to create chat');
      }
    }
  }, [apartmentName, username, selectedUsers, residents, newChatName, fetchChatRooms]);

  const handleRenameChat = useCallback(async (chatId) => {
    if (!newChatName) {
      setError('Please enter a new name');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const chatRoom = chatRooms.find(r => r.id === chatId);
      const isCreator = chatRoom.created_by === username && chatRoom.is_group;
      await axios.patch(`/api/v1/chat-rooms/${chatId}/`, 
        { custom_name: newChatName, is_global: isCreator },
        { headers: { Authorization: `Token ${token}` } }
      );
      await fetchChatRooms();
      setRenameChatId(null);
      setNewChatName('');
      setError(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to rename chat');
    }
  }, [chatRooms, fetchChatRooms, newChatName, username]);

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchChatRooms();
      await fetchResidents();
    };
    fetchInitialData();
  }, [fetchChatRooms, fetchResidents]);

  return (
    <div className="p-8 bg-[#F5F8F6] h-screen flex font-['Helvetica Neue']">
      {/* Sidebar */}
      <div className={`bg-white border border-[#D8E3DC] transition-all duration-300 rounded-xl shadow-sm
        ${isSidebarOpen ? 'w-80' : 'w-28'} overflow-hidden`}>
        <div className="flex items-center justify-between p-6 border-b border-[#E8EFEA]">
          <h1 className={`text-[#2C3B2A] font-semibold text-lg ${isSidebarOpen ? 'block' : 'hidden'}`}>
            Messages ({chatRooms.length})
          </h1>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-[#E8EFEA] text-[#5C7361] hover:text-[#395917]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d={isSidebarOpen ? "M15 19l-7-7 7-7" : "M9 19l7-7-7-7"} />
            </svg>
          </button>
        </div>

        <div className="p-4 relative">
          {error && (
            <div className="absolute top-4 right-4 z-50">
              <AlertMessage
                message={error}
                type="error"
                onClose={() => setError('')}
                duration={5000}
                className="bg-white/90 border border-red-200 text-red-700 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm font-medium text-sm flex items-center gap-2"
              />
            </div>
          )}
          {isSidebarOpen ? (
            <>
              <div className="flex gap-2 mb-6 p-1 bg-[#F5F8F6] rounded-lg">
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                    ${activeTab === 'chats' 
                      ? 'bg-[#395917] text-white shadow-md' 
                      : 'text-[#5C7361] hover:text-[#2C3B2A]'}`}
                >
                  Chats
                </button>
                <button
                  onClick={() => setActiveTab('new')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
                    ${activeTab === 'new' 
                      ? 'bg-[#395917] text-white' 
                      : 'text-[#5C7361] hover:text-[#2C3B2A]'}`}
                >
                  New Chat
                </button>
              </div>
              {activeTab === 'new' && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-4 py-2 rounded-xl 
                      placeholder:text-[#94A898] focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361]"
                  />
                  {selectedUsers.length > 1 && (
                    <input
                      type="text"
                      value={newChatName}
                      onChange={(e) => setNewChatName(e.target.value)}
                      placeholder="Enter group name"
                      className="w-full mt-2 bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-4 py-2 rounded-xl 
                        placeholder:text-[#94A898] focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361]"
                    />
                  )}
                  <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
                    {filteredResidents.map((resident) => (
                      <label key={resident.id} 
                        className="flex items-center p-2 rounded-lg hover:bg-[#E8EFEA] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(resident.id)}
                          onChange={() => {
                            setSelectedUsers(prev => 
                              prev.includes(resident.id) 
                                ? prev.filter(id => id !== resident.id) 
                                : [...prev, resident.id]
                            );
                          }}
                          className="mr-3 w-5 h-5 text-[#395917] border-[#000000] rounded focus:ring-[#5C7361]"
                        />
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: 'BLACK' }}>
                          {getInitials(resident.username)}
                        </div>
                        <span className="ml-2 text-[#2C3B2A]">{resident.username}</span>
                      </label>
                    ))}
                  </div>
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={handleCreateChat}
                      className="w-full mt-4 bg-[#395917] hover:bg-[#2C3B2A] text-white py-2.5 rounded-lg 
                        font-medium transition-all"
                    >
                      {selectedUsers.length > 1 ? 'Create Group Chat' : 'Start Private Chat'}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setActiveTab('new')}
                className="p-2 rounded-lg hover:bg-[#E8EFEA] text-[#5C7361] hover:text-[#395917]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          )}
          {activeTab === 'chats' && (
            <div className="space-y-1">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedChatRoom(room.id)}
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all
                    ${selectedChatRoom === room.id ? 'bg-[#E8EFEA]' : 'hover:bg-[#F5F8F6]'}`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md
                    ${getAvatarColor(room.name)}`}>
                    {getInitials(room.name)}
                  </div>
                  {isSidebarOpen && (
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        {renameChatId === room.id ? (
                          <div className="absolute top-0 left-0 right-0 bg-white p-4 rounded-xl shadow-xl border border-[#D8E3DC] z-50">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-[#2C3B2A] font-medium">Rename Chat</h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameChatId(null);
                                  setNewChatName('');
                                }}
                                className="p-2 hover:bg-[#E8EFEA] rounded-lg text-[#5C7361]"
                              >
                                <X size={18} />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={newChatName}
                              onChange={(e) => setNewChatName(e.target.value)}
                              className="w-full bg-[#F5F8F6] border border-[#D8E3DC] text-[#2C3B2A] px-4 py-2 rounded-xl 
                                placeholder:text-[#94A898] focus:outline-none focus:border-[#5C7361] focus:ring-1 focus:ring-[#5C7361]"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameChatId(null);
                                  setNewChatName('');
                                }}
                                className="px-4 py-2 rounded-lg text-[#5C7361] hover:text-[#2C3B2A] hover:bg-[#E8EFEA]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameChat(room.id);
                                }}
                                className="px-4 py-2 bg-[#395917] text-white rounded-lg hover:bg-[#2C3B2A]"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-[#2C3B2A] font-medium truncate">{room.name}</h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Opening rename for room:', room.id);
                                setRenameChatId(room.id);
                                setNewChatName(room.name);
                              }}
                              className="text-[#5C7361] hover:text-[#395917] p-1.5 rounded-lg hover:bg-[#E8EFEA]"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth NEED="2" 
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-[#5C7361] truncate mt-1">
                        {room.is_group ? `${room.participants.length} members` : room.is_blocked ? 'Blocked' : 'Private Chat'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#D8E3DC] ml-4 overflow-hidden">
        {selectedChatRoom ? (
          <ChatComponent 
            chatRoomId={selectedChatRoom} 
            username={username} 
            chatRoom={chatRooms.find(r => r.id === selectedChatRoom)}
            fetchChatRooms={fetchChatRooms}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#5C7361] text-base">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSection;