import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import ChatPageBodyClass from '../components/ChatPageBodyClass';
import { chatService, ChatRoom, DirectMessage, Message, UserPresence } from '../services/chatService';
import { featureFlagService } from '../services/featureFlagService';
import {
  MessageCircle,
  Users,
  Plus,
  Search,
  Send,
  Paperclip,
  Smile,
  X,
  User,
  Clock,
  Check,
  CheckCheck,
  Video,
  Phone,
  LogOut,
  LogIn,
  Star,
  Globe,
  Shield,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Meh,
  Menu,
  ArrowLeft,
  MoreHorizontal,
  Mic,
  Camera,
  GalleryHorizontal,
  RefreshCw,
  FileText,
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic as MicIcon,
  Send as SendIcon,
  Smile as SmileIcon,
  Paperclip as PaperclipIcon,
  X as XIcon,
  Plus as PlusIcon,
  ChevronLeft,
  MoreVertical,
  PhoneCall,
  Calendar,
} from 'lucide-react';

const Chat: React.FC = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'rooms' | 'dms' | 'events'>('rooms');
  // Initialize selectedRoom from localStorage to persist across refresh
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(() => {
    const saved = localStorage.getItem('selectedRoom');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedDM, setSelectedDM] = useState<DirectMessage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showStartDM, setShowStartDM] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [dms, setDMs] = useState<DirectMessage[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isPhoneEnabled, setIsPhoneEnabled] = useState(true);
  const [isLiveStreamingEnabled, setIsLiveStreamingEnabled] = useState(true);
  const location = useLocation();

  // Save selectedRoom to localStorage whenever it changes
  useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem('selectedRoom', JSON.stringify(selectedRoom));
    } else {
      localStorage.removeItem('selectedRoom');
    }
  }, [selectedRoom]);

  // Create Room Modal State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomType, setNewRoomType] = useState('general');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Emoji reactions
  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Touch handling for pull-to-refresh
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isPullingDown = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isPullingDown.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY;
    const diff = touchCurrentY.current - touchStartY.current;
    
    // If pulling down and at the top of the list
    if (diff > 50 && !isPullingDown.current) {
      isPullingDown.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (isPullingDown.current && touchCurrentY.current - touchStartY.current > 50) {
      handlePullToRefresh();
    }
    isPullingDown.current = false;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartDM = async (recipientId: number) => {
    try {
      setIsLoading(true);
      const response = await chatService.startDM(recipientId);
      
      if (response.new) {
        setDMs(prev => [response.dm, ...prev]);
      }
      
      setSelectedDM(response.dm);
      setSelectedRoom(null);
      setActiveTab('dms');
      setSidebarOpen(false);
      setShowStartDM(false);
      setUserSearchQuery('');
      setUserSearchResults([]);
    } catch (error) {
      console.error('Error starting DM:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadInitialData();

    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new_dm') {
      setShowStartDM(true);
      setActiveTab('dms');
    }

    const userId = params.get('userId');
    if (userId) {
      handleStartDM(parseInt(userId));
    }

    // Handle roomId parameter for auto-joining a room
    const roomId = params.get('roomId');
    if (roomId) {
      const joinRoomById = async () => {
        try {
          await chatService.joinRoom(parseInt(roomId));
          const roomResponse = await chatService.getRooms({ limit: 100 });
          const room = roomResponse.data.rooms.find((r: ChatRoom) => r.id === parseInt(roomId));
          if (room) {
            setSelectedRoom(room);
            setSelectedDM(null);
            setActiveTab('rooms');
            if (window.innerWidth < 768) {
              setMobileView('chat');
            }
          }
        } catch (err) {
          console.error('Failed to join room from URL:', err);
        }
      };
      joinRoomById();
    }
  }, [location.search]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData: Message) => {
      const isCurrentRoom = selectedRoom && Number(messageData.room_id) === Number(selectedRoom.id);
      const isCurrentDM = selectedDM && Number(messageData.dm_id) === Number(selectedDM.id);

      if (isCurrentRoom || isCurrentDM) {
        setMessages(prev => {
          if (prev.some(m => m.id === messageData.id)) return prev;
          return [...prev, messageData];
        });
      }
    };
    const handleStatusChange = () => {
      loadInitialData();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_status_changed', handleStatusChange);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [socket, selectedRoom?.id, selectedDM?.id]);

  useEffect(() => {
    if (selectedRoom && user) {
      joinRoomAndLoadMessages(selectedRoom.id);
    }
  }, [selectedRoom?.id, user?.id]);

  // Load feature flags on component mount
  useEffect(() => {
    const loadFeatureFlags = async () => {
      try {
        const status = await featureFlagService.getStatus();
        if (status.data && status.data.features) {
          const features = status.data.features;
          setIsLiveStreamingEnabled(features.liveVideoStreaming);
          setIsVideoEnabled(features.videoCalls);
          setIsPhoneEnabled(features.phoneCalls);
        } else {
          console.warn('Feature flags response missing expected structure:', status);
          // Default to enabled if response structure is unexpected
          setIsLiveStreamingEnabled(true);
          setIsVideoEnabled(true);
          setIsPhoneEnabled(true);
        }
      } catch (error) {
        console.error('Failed to load feature flags:', error);
        // Default to enabled if we can't load flags
        setIsLiveStreamingEnabled(true);
        setIsVideoEnabled(true);
        setIsPhoneEnabled(true);
      }
    };
    loadFeatureFlags();
  }, []);

  const joinRoomAndLoadMessages = async (roomId: number) => {
    try {
      await chatService.joinRoom(roomId);
      joinRoomSocket(roomId);
      await loadRoomMessages(roomId);
    } catch (error) {
      console.error('Error joining room or loading messages:', error);
    }
  };

  useEffect(() => {
    if (selectedDM && user) {
      joinDMSocket(selectedDM.id);
      loadDMMessages(selectedDM.id);
    }
  }, [selectedDM?.id, user?.id]);

  const loadInitialData = async () => {
    try {
      const roomsResponse = await chatService.getRooms({ limit: 100 });
      setRooms(roomsResponse.data.rooms);

      const dmsResponse = await chatService.getDMs({ limit: 50 });
      setDMs(dmsResponse.data.dms);

      const onlineResponse = await chatService.getOnlineUsers();
      setOnlineUsers(onlineResponse.online_users);

      await chatService.updateUserPresence({ is_online: true });
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handlePullToRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Reload the appropriate data based on current context
      if (selectedRoom) {
        // Refresh room messages first for immediate feedback
        await loadRoomMessages(selectedRoom.id);
        // Then refresh the room list in background
        await loadInitialData();
      } else if (selectedDM) {
        // Refresh DM messages first for immediate feedback
        await loadDMMessages(selectedDM.id);
        // Then refresh the DM list in background
        await loadInitialData();
      } else {
        // No chat selected, just refresh lists
        await loadInitialData();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const joinRoomSocket = (roomId: number) => {
    if (socket) {
      socket.emit('join_room', roomId);
    }
  };

  const joinDMSocket = (dmId: number) => {
    if (socket) {
      socket.emit('join_dm', dmId);
    }
  };

  const loadRoomMessages = async (roomId: number) => {
    try {
      setIsLoading(true);
      const response = await chatService.getRoomMessages(roomId, { limit: 50 });
      setMessages([...response.data.messages].reverse());
    } catch (error) {
      console.error('Error loading room messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDMMessages = async (dmId: number) => {
    try {
      setIsLoading(true);
      const response = await chatService.getDMMessages(dmId, { limit: 50 });
      setMessages([...response.data.messages].reverse());
    } catch (error) {
      console.error('Error loading DM messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    const messageData = {
      content: newMessage.trim(),
      message_type: (file ? 'file' : 'text') as 'text' | 'file' | 'image' | 'system',
      room_id: selectedRoom?.id,
      dm_id: selectedDM?.id,
      file: file || undefined
    };

    try {
      await chatService.sendMessage(messageData);
      setNewMessage('');
      setFile(null);
      setShowFileOptions(false);
      
      if (selectedRoom) {
        await chatService.updateUserPresence({ 
          is_online: true, 
          current_room_id: selectedRoom.id 
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setShowFileOptions(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // User Search for DM
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url = userSearchQuery.trim() 
          ? `/api/users?search=${userSearchQuery}&limit=100`
          : `/api/users?limit=100`;
          
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserSearchResults(data.data.users.filter((u: any) => u.id !== user?.id));
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (showStartDM) {
      const timeoutId = setTimeout(fetchUsers, userSearchQuery.trim() ? 300 : 0);
      return () => clearTimeout(timeoutId);
    }
  }, [userSearchQuery, user, showStartDM]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;

    try {
      setIsLoading(true);
      const response = await chatService.createRoom({
        name: newRoomName.trim(),
        description: newRoomDescription.trim(),
        room_type: newRoomType,
        is_private: false,
        max_participants: 100
      });

      setRooms(prev => [...prev, response.data.room]);
      setShowCreateRoom(false);
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomType('general');
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load events when events tab is active
  useEffect(() => {
    if (activeTab === 'events') {
      const fetchEvents = async () => {
        try {
          const response = await fetch('/api/events', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setEvents(data.data.events || []);
          }
        } catch (error) {
          console.error('Error fetching events:', error);
        }
      };
      fetchEvents();
    }
  }, [activeTab]);

  const handleDMResponse = async (action: 'accepted' | 'declined') => {
    if (!selectedDM) {
      console.error('No DM selected');
      alert('No conversation selected. Please try again.');
      return;
    }
    
    if (!user?.id) {
      console.error('No user logged in');
      alert('You must be logged in to respond to message requests.');
      return;
    }
    
    // Check if the current user is the creator (creators can't respond to their own requests)
    if (selectedDM.created_by === user.id) {
      console.error('Creator cannot respond to their own DM request');
      alert('You cannot respond to your own message request. Wait for the other person to accept.');
      return;
    }
    
    const dmId = selectedDM.id;
    setIsLoading(true);
    
    console.log(`Responding to DM ${dmId} with action: ${action}, user: ${user.id}, createdBy: ${selectedDM.created_by}`);
    
    try {
      const response = await chatService.respondToDM(dmId, action);
      console.log('DM response successful:', response);
      
      // Refresh DM list
      const dmsResponse = await chatService.getDMs({ limit: 50 });
      setDMs(dmsResponse.data.dms);
      
      // Find and update the selected DM
      const updatedDM = dmsResponse.data.dms.find((d: any) => d.id === dmId);
      if (updatedDM) {
        setSelectedDM(updatedDM);
        // Load messages if accepted
        if (action === 'accepted') {
          await loadDMMessages(dmId);
        }
      } else if (action === 'declined') {
        // If declined, the DM might be removed, so clear selection
        setSelectedDM(null);
        setMessages([]);
        setMobileView('list');
      }
    } catch (error: any) {
      console.error('Error responding to DM:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      
      // Try to get the most specific error message
      let errorMessage = `Failed to ${action} the message request.`;
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete room handler
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedRoom.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      await chatService.deleteRoom(selectedRoom.id);
      
      // Remove the room from the list
      setRooms(prev => prev.filter(r => r.id !== selectedRoom.id));
      
      // Clear selection and go back to list
      setSelectedRoom(null);
      setMobileView('list');
      setShowRoomMenu(false);
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete room. You may not be the owner.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete DM handler
  const handleDeleteDM = async () => {
    if (!selectedDM) return;
    
    const dmIdToDelete = selectedDM.id;
    const otherUser = getOtherParticipant(selectedDM);
    const confirmDelete = window.confirm(`Are you sure you want to delete your conversation with ${otherUser?.username || 'this user'}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      setShowRoomMenu(false);
      
      // Clear state immediately for responsive UI
      setSelectedDM(null);
      setMessages([]);
      setMobileView('list');
      
      // Call API to delete
      await chatService.deleteDM(dmIdToDelete);
      
      // Remove the DM from the list
      setDMs(prev => prev.filter(d => d.id !== dmIdToDelete));
    } catch (error) {
      console.error('Error deleting DM:', error);
      alert('Failed to delete conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if current user is the room owner or admin (authorization is handled by backend)
  const isRoomOwner = selectedRoom && user && (selectedRoom.created_by === user.id);

  const isUserOnline = (userId: number) => {
    return onlineUsers.some(u => u.user_id === userId);
  };

  const getOtherParticipant = (dm: DirectMessage | null) => {
    if (!dm || !dm.participants) return null;
    return dm.participants.find(p => p.id !== user?.id);
  };

  // ==================== MOBILE-FIRST DESIGN ====================
  // Using spiritual theme: gradient backgrounds, glassmorphism, yellow accents

  // Mobile: Full screen conversation view
  // Desktop: Side-by-side layout
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  useEffect(() => {
    // Determine initial view based on selection
    if (selectedRoom || selectedDM) {
      setMobileView('chat');
    } else {
      setMobileView('list');
    }
  }, [selectedRoom, selectedDM]);

  // Render conversation list (mobile-first)
  // Desktop: Always show list (flex), Mobile: toggle based on mobileView
  const conversationListRef = useRef<HTMLDivElement>(null);
  
  const renderConversationList = () => (
    <div 
      ref={conversationListRef}
      className={`flex flex-col bg-white border-r border-gray-200 shadow-sm z-40 overflow-hidden ${mobileView === 'chat' ? 'hidden md:flex md:w-72 lg:w-80 xl:w-96 h-full' : 'w-full h-full'}`}
    >
      {/* Header with spiritual gradient - fixed */}
      <div className="bg-gradient-to-r from-mindful-purple via-serene-blue to-calm-green p-4 w-full flex-shrink-0" style={{ flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setShowCreateRoom(true)}
              className="p-2 bg-white bg-opacity-20 rounded-full text-white hover:bg-opacity-30 transition-all"
              aria-label="Create room"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowStartDM(true)}
              className="p-2 bg-yellow-400 rounded-full text-mindful-purple hover:bg-yellow-300 transition-all"
              aria-label="New DM"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'rooms'
                ? 'bg-white text-mindful-purple shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Rooms
          </button>
          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'dms'
                ? 'bg-white text-mindful-purple shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            DM
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'events'
                ? 'bg-white text-mindful-purple shadow-lg'
                : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
            }`}
          >
            Events
          </button>
        </div>
      </div>


      {/* Scrollable list area with pull-to-refresh */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-b from-indigo-50 via-purple-50 to-emerald-50 overscroll-contain"
        style={{ overscrollBehavior: 'contain' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {activeTab === 'events' ? (
          <div className="space-y-2 p-4">
            {events.length > 0 ? (
              events.map((event: any) => {
                const hasRoom = event.room_created && event.chat_room_id;
                return (
                  <button
                    key={event.id}
                    onClick={async () => {
                      if (hasRoom) {
                        // Join the event's chat room
                        try {
                          await chatService.joinRoom(event.chat_room_id);
                          const roomResponse = await chatService.getRooms({ limit: 100 });
                          const room = roomResponse.data.rooms.find((r: ChatRoom) => r.id === event.chat_room_id);
                          if (room) {
                            setSelectedRoom(room);
                            setSelectedDM(null);
                            if (window.innerWidth < 768) {
                              setMobileView('chat');
                            }
                          }
                        } catch (err) {
                          console.error('Failed to join event room:', err);
                        }
                      } else {
                        // Navigate to events page
                        navigate('/events');
                      }
                    }}
                    className={`w-full p-4 rounded-2xl transition-all duration-200 text-left ${
                      hasRoom 
                        ? 'bg-gradient-to-r from-mindful-purple to-serene-blue text-white shadow-lg' 
                        : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                        hasRoom 
                          ? 'bg-white bg-opacity-20 text-white' 
                          : 'bg-gradient-to-br from-mindful-purple to-serene-blue text-white'
                      }`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold truncate ${hasRoom ? 'text-white' : 'text-gray-900'}`}>
                            {event.title}
                          </h4>
                          {hasRoom && (
                            <span className="text-xs px-2 py-1 bg-green-400 text-white rounded-full font-medium">
                              Live Chat
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate mt-1 ${hasRoom ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                          {event.description || 'No description'}
                        </p>
                        <p className={`text-xs mt-1 ${hasRoom ? 'text-white text-opacity-70' : 'text-mindful-purple'}`}>
                          {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No events yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  <button onClick={() => navigate('/events')} className="text-mindful-purple hover:underline">
                    Browse events
                  </button> to join
                </p>
              </div>
            )}
          </div>
        ) : activeTab === 'rooms' ? (
          <div className="space-y-2 px-3 py-2">
            {rooms.filter(room => room.room_type !== 'event').map((room) => (
                <button
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room);
                    setSelectedDM(null);
                    if (window.innerWidth < 768) {
                      setMobileView('chat');
                    }
                  }}
                  className={`w-full p-3 rounded-xl transition-all duration-200 text-left ${
                    selectedRoom?.id === room.id
                      ? 'bg-gradient-to-r from-mindful-purple to-serene-blue text-white shadow-lg'
                      : 'bg-white hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                      selectedRoom?.id === room.id
                        ? 'bg-white bg-opacity-20 text-white'
                        : 'bg-gradient-to-br from-mindful-purple to-serene-blue text-white'
                    }`}>
                      {room.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold truncate text-sm ${selectedRoom?.id === room.id ? 'text-white' : 'text-gray-900'}`}>
                          {room.name}
                        </h4>
                        <span className={`text-xs ${selectedRoom?.id === room.id ? 'text-white text-opacity-70' : 'text-gray-400'}`}>
                          {room.participant_count}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${selectedRoom?.id === room.id ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                        {room.description || 'No description'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            {rooms.filter(room => room.room_type !== 'event').length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No rooms yet</p>
                <p className="text-gray-400 text-sm mt-1">Create a room to start chatting</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {dms.map((dm) => {
                const other = getOtherParticipant(dm);
                const isOnline = other ? isUserOnline(other.id) : false;
                return (
                  <button
                    key={dm.id}
                    onClick={() => {
                      setSelectedDM(dm);
                      setSelectedRoom(null);
                      if (window.innerWidth < 768) {
                        setMobileView('chat');
                      }
                    }}
                    className={`w-full p-4 rounded-2xl transition-all duration-200 text-left ${
                      selectedDM?.id === dm.id
                        ? 'bg-gradient-to-r from-mindful-purple to-serene-blue text-white shadow-lg'
                        : 'bg-white hover:bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold ${
                          selectedDM?.id === dm.id
                            ? 'bg-white bg-opacity-20 text-white'
                            : 'bg-gradient-to-br from-mindful-purple to-serene-blue text-white'
                        }`}>
                          {other?.username.charAt(0) || '?'}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold truncate ${selectedDM?.id === dm.id ? 'text-white' : 'text-gray-900'}`}>
                            {other?.username || 'Unknown'}
                          </h4>
                          {dm.status === 'pending' && dm.created_by !== user?.id && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              selectedDM?.id === dm.id 
                                ? 'bg-yellow-400 text-mindful-purple' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              Pending
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate mt-1 ${selectedDM?.id === dm.id ? 'text-white text-opacity-80' : 'text-gray-500'}`}>
                          {dm.status === 'pending' && dm.created_by !== user?.id 
                            ? 'Wants to connect with you'
                            : 'Direct message'
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            {dms.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No messages yet</p>
                <p className="text-gray-400 text-sm mt-1">Start a conversation</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render chat area
  const renderChatArea = () => {
    const chatTitle = selectedRoom?.name || (selectedDM ? getOtherParticipant(selectedDM)?.username : null) || 'Chat';
    const chatSubtitle = selectedRoom 
      ? `${selectedRoom.participant_count} members`
      : selectedDM 
        ? (selectedDM.status === 'accepted' || selectedDM.created_by === user?.id ? 'Active' : 'Pending')
        : '';

    return (
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col w-full overflow-hidden h-full`}>
        {/* Chat Header with spiritual gradient */}
        <div className="bg-gradient-to-r from-mindful-purple via-serene-blue to-calm-green px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Back button for mobile */}
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setSelectedDM(null);
                  setMessages([]); // Clear messages when leaving
                  setMobileView('list');
                }}
                className="md:hidden p-2 -ml-2 text-white hover:bg-white hover:bg-opacity-20 rounded-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              {/* Title & Subtitle */}
              <div className="ml-2">
                <h3 className="font-bold text-white text-lg">{chatTitle}</h3>
                <p className="text-white text-opacity-70 text-sm">{chatSubtitle}</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-1 relative">
              <button 
                onClick={() => {
                  // Check if phone calls are enabled
                  if (!isLiveStreamingEnabled || !isPhoneEnabled) {
                    alert('Phone calls are currently disabled by the administrator.');
                    return;
                  }
                  
                  // Start phone call
                  const roomId = selectedRoom ? selectedRoom.id : selectedDM?.id;
                  const roomName = selectedRoom ? selectedRoom.name : getOtherParticipant(selectedDM)?.username;
                  const userId = user?.id || 'user-' + Math.floor(Math.random() * 1000);
                  const userName = user?.username || 'User';
                  
                  // Use absolute URL to ensure proper routing
                  const currentOrigin = window.location.origin;
                  const videoUrl = `${currentOrigin}/video-call/${roomId}?userId=${userId}&userName=${encodeURIComponent(userName)}&type=phone`;
                  window.open(videoUrl, '_blank');
                }}
                disabled={!isLiveStreamingEnabled || !isPhoneEnabled}
                className={`p-2 rounded-xl text-white transition-all ${
                  !isLiveStreamingEnabled || !isPhoneEnabled 
                    ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <PhoneCall className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  // Check if video calls are enabled
                  if (!isLiveStreamingEnabled || !isVideoEnabled) {
                    alert('Video calls are currently disabled by the administrator.');
                    return;
                  }
                  
                  console.log('Chat - Video call button clicked:', {
                    selectedRoom,
                    selectedDM,
                    user,
                    roomId: selectedRoom ? selectedRoom.id : selectedDM?.id,
                    roomName: selectedRoom ? selectedRoom.name : getOtherParticipant(selectedDM)?.username
                  });
                  
                  // Start video call
                  const roomId = selectedRoom ? selectedRoom.id : selectedDM?.id;
                  const roomName = selectedRoom ? selectedRoom.name : getOtherParticipant(selectedDM)?.username;
                  const userId = user?.id || 'user-' + Math.floor(Math.random() * 1000);
                  const userName = user?.username || 'User';
                  
                  console.log('Chat - Navigating to video test with params:', {
                    roomId,
                    roomName,
                    userId,
                    userName,
                    type: 'video'
                  });
                  
                  // Use absolute URL to ensure proper routing
                  const currentOrigin = window.location.origin;
                  const videoUrl = `${currentOrigin}/video-call/${roomId}?userId=${userId}&userName=${encodeURIComponent(userName)}&type=video`;
                  window.open(videoUrl, '_blank');
                }}
                disabled={!isLiveStreamingEnabled || !isVideoEnabled}
                className={`p-2 rounded-xl text-white transition-all ${
                  !isLiveStreamingEnabled || !isVideoEnabled 
                    ? 'bg-gray-400 cursor-not-allowed opacity-50' 
                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                }`}
              >
                <Video className="w-5 h-5" />
              </button>
              {/* 3-dot menu for room options */}
              <div className="relative">
                <button 
                  onClick={() => setShowRoomMenu(!showRoomMenu)}
                  className="p-2 bg-white bg-opacity-20 rounded-xl text-white hover:bg-opacity-30 transition-all"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {/* Mobile Overlay for menu */}
                {showRoomMenu && (
                  <div 
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setShowRoomMenu(false)}
                  />
                )}
                
                {/* Dropdown Menu */}
                {showRoomMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {selectedRoom && (
                      <button
                        onClick={() => {
                          setShowRoomMenu(false);
                          handleDeleteRoom();
                        }}
                        className="w-full px-4 py-3 text-left text-red-500 hover:bg-red-50 flex items-center space-x-3 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="font-medium">Delete Room</span>
                      </button>
                    )}
                    {selectedDM && (
                      <button
                        onClick={() => {
                          setShowRoomMenu(false);
                          handleDeleteDM();
                        }}
                        className="w-full px-4 py-3 text-left text-red-500 hover:bg-red-50 flex items-center space-x-3 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="font-medium">Delete DM</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area with spiritual gradient background - with pull-to-refresh */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-indigo-50 via-purple-50 to-emerald-50 min-h-0 overscroll-contain" 
          style={{ overscrollBehavior: 'contain' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull to refresh indicator */}
          {isRefreshing && (
            <div className="flex flex-col items-center justify-center py-4 mb-4 bg-white bg-opacity-80 rounded-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-mindful-purple border-t-transparent mb-2"></div>
              <p className="text-sm text-mindful-purple font-medium">Refreshing messages...</p>
            </div>
          )}
          {/* Pending DM Request - Only show to the recipient, not the creator */}
          {selectedDM && selectedDM.status === 'pending' && Number(selectedDM.created_by) !== Number(user?.id) && (
            <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-mindful-purple to-serene-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Message Request</h3>
                <p className="text-gray-600 mb-6">
                  {getOtherParticipant(selectedDM)?.username} wants to connect with you
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => handleDMResponse('accepted')}
                    disabled={isLoading}
                    className="flex-1 max-w-[140px] py-3 bg-gradient-to-r from-mindful-purple to-serene-blue text-white rounded-2xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                    <span>{isLoading ? 'Accepting...' : 'Accept'}</span>
                  </button>
                  <button
                    onClick={() => handleDMResponse('declined')}
                    disabled={isLoading}
                    className="flex-1 max-w-[140px] py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Waiting for acceptance - Show to the creator */}
          {selectedDM && selectedDM.status === 'pending' && Number(selectedDM.created_by) === Number(user?.id) && (
            <div className="bg-white bg-opacity-80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Request Sent</h3>
                <p className="text-gray-600">
                  Waiting for {getOtherParticipant(selectedDM)?.username} to accept your message request
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-mindful-purple border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-500">Loading messages...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-mindful-purple to-serene-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <p className="text-lg font-semibold text-gray-700">
                  {selectedRoom ? 'Start the conversation' : 'Say hello!'}
                </p>
                <p className="text-gray-400 mt-2">Be the first to send a message</p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === user?.id;
              const showDate = index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-6">
                      <span className="px-4 py-2 bg-white bg-opacity-60 backdrop-blur-sm rounded-full text-sm text-gray-500 font-medium shadow-sm">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
                    {!isOwn && (
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-mindful-purple to-serene-blue rounded-2xl flex items-center justify-center text-white font-bold">
                          {message.sender?.username?.charAt(0) || '?'}
                        </div>
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] ${isOwn ? 'order-1' : 'order-2'}`}>
                      {/* Message Bubble with glassmorphism */}
                      <div className={`px-5 py-4 rounded-3xl shadow-sm ${
                        message.message_type === 'system'
                          ? 'bg-gray-100 text-gray-500 text-center text-sm italic'
                          : isOwn 
                            ? 'bg-gradient-to-r from-mindful-purple to-serene-blue text-white'
                            : 'bg-white border border-gray-100 text-gray-900'
                      }`}>
                        {message.message_type === 'file' ? (
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                              <FileText className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{message.file_name}</p>
                              <p className="text-xs opacity-70">{Math.round(message.file_size / 1024)} KB</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-base leading-relaxed">{message.content}</p>
                        )}
                      </div>
                      
                      {/* Time & Sender */}
                      <div className={`flex items-center space-x-2 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        {!isOwn && message.sender && (
                          <span className="text-sm text-gray-600 font-medium">{message.sender.username}</span>
                        )}
                        <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Floating style with spiritual theme */}
        {(selectedRoom || (selectedDM && (selectedDM.status === 'accepted' || selectedDM.created_by === user?.id))) ? (
          <div className="p-2 sm:p-4 bg-white border-t border-gray-100">
            <div className="flex items-end gap-1 sm:gap-3 bg-gray-50 rounded-3xl p-2 sm:p-3 border border-gray-200 overflow-x-hidden">
              {/* File Button - smaller on mobile */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 sm:p-3 text-gray-400 hover:text-mindful-purple hover:bg-mindful-purple hover:bg-opacity-10 rounded-xl transition-all flex-shrink-0"
              >
                <PaperclipIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Emoji Button - smaller on mobile */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 sm:p-3 text-gray-400 hover:text-mindful-purple hover:bg-mindful-purple hover:bg-opacity-10 rounded-xl transition-all flex-shrink-0"
              >
                <SmileIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Input */}
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 min-w-0 px-2 sm:px-4 py-2 sm:py-3 bg-transparent border-0 focus:outline-none text-sm sm:text-base"
                disabled={!isConnected}
              />

              {/* Send Button - smaller on mobile */}
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && !file}
                className={`p-2 sm:p-3 rounded-xl transition-all flex-shrink-0 ${
                  (!newMessage.trim() && !file) 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-gradient-to-r from-mindful-purple to-serene-blue text-white hover:shadow-lg'
                }`}
              >
                <SendIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* File Preview */}
            {file && (
              <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-mindful-purple bg-opacity-10 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-mindful-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-3 p-3 bg-white rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-gray-100 rounded-xl transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 px-8 bg-white border-t border-gray-100 text-center">
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 top-16 bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 overflow-hidden">
      {/* Body class manager */}
      <ChatPageBodyClass />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main container with proper height */}
      <div className="h-full flex">
        {/* Conversation List */}
        {renderConversationList()}

        {/* Chat Area */}
        {renderChatArea()}
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Create Room</h3>
              <button 
                onClick={() => setShowCreateRoom(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-mindful-purple text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Describe your room..."
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-mindful-purple text-base"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Type</label>
                <select 
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-mindful-purple text-base"
                >
                  <option value="general">General Discussion</option>
                  <option value="spiritual">Spiritual Discussion</option>
                  <option value="meditation">Meditation & Mindfulness</option>
                  <option value="healing">Energy Healing</option>
                  <option value="support">Support & Guidance</option>
                </select>
              </div>
              
              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateRoom(false);
                    setNewRoomName('');
                    setNewRoomDescription('');
                    setNewRoomType('general');
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim() || isLoading}
                  className={`flex-1 px-4 py-3 bg-gradient-to-r from-mindful-purple to-serene-blue text-white rounded-2xl font-semibold transition-all ${
                    (!newRoomName.trim() || isLoading) ? 'opacity-50' : 'hover:shadow-lg'
                  }`}
                >
                  {isLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start DM Modal */}
      {showStartDM && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">New Message</h3>
              <button 
                onClick={() => {
                  setShowStartDM(false);
                  setUserSearchQuery('');
                  setUserSearchResults([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-mindful-purple text-base"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {userSearchResults.length > 0 ? (
                userSearchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartDM(u.id)}
                    className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-2xl transition-all text-left border border-transparent hover:border-mindful-purple group"
                  >
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-mindful-purple to-serene-blue rounded-2xl flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      {u.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{u.username}</p>
                      <p className="text-sm text-gray-500">
                        {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : 'Spiritual Seeker'}
                      </p>
                    </div>
                    <PlusIcon className="w-6 h-6 text-mindful-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Search for users to message</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom VideoIcon2 component to avoid conflict
const VideoIcon2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

export default Chat;
