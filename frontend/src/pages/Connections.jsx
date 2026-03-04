import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,
  Search,
  Loader,
  Send,
  Check,
  X,
  Plus
} from 'lucide-react';
import ClickableAvatar from '../components/ClickableAvatar';
import { chatService } from '../services/chatService';

const Connections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [requestedIds, setRequestedIds] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch connection suggestions
      const suggestionsResponse = await fetch('/api/connections/users/suggestions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json();
        if (suggestionsData.success) {
          setUsers(suggestionsData.users);
        }
      }

      // Fetch existing connections
      const connectionsResponse = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        if (connectionsData.success) {
          setConnections(connectionsData.connections);
        }
      }

      // Fetch pending requests (where current user is the receiver)
      const pendingResponse = await fetch('/api/connections?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        if (pendingData.success) {
          // Filter to only show requests where current user is the receiver
          const receivedRequests = pendingData.connections.filter(conn =>
            conn.receiver_id === user.id
          );
          setPendingRequests(receivedRequests);
        }
      }

    } catch (error) {
      console.error('Error fetching connections data:', error);
      setError('Failed to load connections data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const sendConnectionRequest = async (userId) => {
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mark as requested instead of removing
          setRequestedIds(prev => [...prev, userId]);
          
          // Add to pending requests
          const requestedUser = users.find(u => u.id === userId);
          setPendingRequests([...pendingRequests, {
            id: data.connection.id,
            username: requestedUser?.username,
            first_name: requestedUser?.first_name,
            last_name: requestedUser?.last_name,
            spiritual_intention: requestedUser?.spiritual_intention,
            status: 'pending',
            created_at: new Date()
          }]);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      setError('Failed to send connection request');
    }
  };

  const handleConnectionAction = async (connectionId, action) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: action })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          if (action === 'accepted') {
            // Move from pending to connections
            const acceptedConnection = pendingRequests.find(conn => conn.id === connectionId);
            setConnections([...connections, acceptedConnection]);
          }
          // Remove from pending requests
          setPendingRequests(pendingRequests.filter(conn => conn.id !== connectionId));
        }
      }
    } catch (error) {
      console.error('Error handling connection request:', error);
      setError('Failed to handle connection request');
    }
  };

  const removeConnection = async (connectionId) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove from connections
          setConnections(connections.filter(conn => conn.id !== connectionId));
        }
      }
    } catch (error) {
      console.error('Error removing connection:', error);
      setError('Failed to remove connection');
    }
  };

  const handleStartDM = async (userId, username) => {
    try {
      console.log('Starting DM with user:', userId, username); // Debug log
      
      // First, check if a DM already exists
      console.log('Fetching existing DMs...'); // Debug log
      const dmsResponse = await chatService.getDMs();
      console.log('DMs response:', dmsResponse); // Debug log
      
      if (dmsResponse.success && dmsResponse.dms && Array.isArray(dmsResponse.dms)) {
        console.log('Found DMs:', dmsResponse.dms.length); // Debug log
        
        // Check if there's already a DM with this user
        const existingDM = dmsResponse.dms.find(dm => {
          console.log('Checking DM:', dm.id, 'participants:', dm.participants); // Debug log
          return dm.participants && Array.isArray(dm.participants) && 
                 dm.participants.some(p => p.id === userId);
        });
        
        if (existingDM) {
          console.log('Found existing DM:', existingDM.id); // Debug log
          // DM exists, navigate to it
          navigate(`/chat?dmId=${existingDM.id}`);
          return;
        } else {
          console.log('No existing DM found, will create new one'); // Debug log
        }
      } else {
        console.log('Failed to fetch DMs or no DMs found'); // Debug log
      }
      
      // No existing DM, create a new one
      console.log('Creating new DM...'); // Debug log
      const dmResponse = await chatService.startDM(userId);
      console.log('DM creation response:', dmResponse); // Debug log
      
      if (dmResponse.success && dmResponse.dm && dmResponse.dm.id) {
        console.log('DM created successfully:', dmResponse.dm.id); // Debug log
        // DM created successfully, navigate to chat with the DM ID
        navigate(`/chat?dmId=${dmResponse.dm.id}`);
      } else {
        console.log('DM creation failed, response:', dmResponse); // Debug log
        // DM creation failed, redirect to Connections page
        navigate('/connections');
      }
    } catch (error) {
      console.error('Error starting DM:', error); // Debug log
      // On error, redirect to Connections page
      navigate('/connections');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header - Gradient Banner like Dashboard */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-mindful-purple to-serene-blue rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                  <span>🤝</span> Connections
                </h1>
                <p className="text-white text-opacity-90 text-sm sm:text-base">
                  Build your spiritual network and connect with like-minded seekers
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100 mb-6">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'suggestions' 
                  ? 'bg-gradient-to-r from-mindful-purple via-serene-blue to-calm-green text-white shadow-lg shadow-mindful-purple/30' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md'
              }`}
            >
              New Connections
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'pending' 
                  ? 'bg-gradient-to-r from-mindful-purple via-serene-blue to-calm-green text-white shadow-lg shadow-mindful-purple/30' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md'
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setActiveTab('connections')}
              className={`px-4 py-2 sm:px-6 sm:py-3 text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                activeTab === 'connections' 
                  ? 'bg-gradient-to-r from-mindful-purple via-serene-blue to-calm-green text-white shadow-lg shadow-mindful-purple/30' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 shadow-md'
              }`}
            >
              My Connections
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          {/* Connection Suggestions Tab */}
          {activeTab === 'suggestions' && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for spiritual seekers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mindful-purple focus:border-transparent"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin mx-auto w-8 h-8 text-mindful-purple" />
                  <p className="mt-2 text-gray-600">Loading connection suggestions...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No connection suggestions found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search or check back later</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((suggestion) => (
                    <div key={suggestion.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <ClickableAvatar user={suggestion} size="w-12 h-12" />
                          <div>
                            <Link to={`/profile/${suggestion.username}`} className="font-semibold text-gray-900 hover:text-mindful-purple transition-colors">{suggestion.username}</Link>
                            <p className="text-sm text-gray-600">
                              {suggestion.first_name} {suggestion.last_name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.spiritual_intention || 'Spiritual Seeker'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                        {suggestion.bio || 'No bio available'}
                      </p>
                      <button
                        onClick={() => sendConnectionRequest(suggestion.id)}
                        disabled={loading || requestedIds.includes(suggestion.id)}
                        className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 font-bold ${
                          requestedIds.includes(suggestion.id) 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-mindful-purple hover:bg-purple-700 text-white shadow-md active:scale-95'
                        }`}
                      >
                        {requestedIds.includes(suggestion.id) ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Requested</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Connect</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Tab */}
          {activeTab === 'pending' && (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin mx-auto w-8 h-8 text-mindful-purple" />
                  <p className="mt-2 text-gray-600">Loading pending requests...</p>
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending connection requests</p>
                  <p className="text-sm text-gray-400 mt-1">Connection requests you send will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ClickableAvatar user={request} size="w-12 h-12" />
                          <div>
                            <Link to={`/profile/${request.username}`} className="font-semibold text-gray-900 hover:text-mindful-purple transition-colors">{request.username}</Link>
                            <p className="text-sm text-gray-600">
                              {request.first_name} {request.last_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConnectionAction(request.id, 'accepted')}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleConnectionAction(request.id, 'declined')}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {request.spiritual_intention || 'Spiritual Seeker'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Requested {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Connections Tab */}
          {activeTab === 'connections' && (
            <div>
              {loading ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin mx-auto w-8 h-8 text-mindful-purple" />
                  <p className="mt-2 text-gray-600">Loading your connections...</p>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No connections yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start connecting with other spiritual seekers!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connections.map((myConn) => (
                    <div key={myConn.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <ClickableAvatar user={myConn} size="w-12 h-12" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <Link to={`/profile/${myConn.username}`} className="font-semibold text-gray-900 hover:text-mindful-purple transition-colors">{myConn.username}</Link>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${myConn.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                {myConn.is_online ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {myConn.first_name} {myConn.last_name}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {myConn.spiritual_intention || 'Spiritual Seeker'}
                      </p>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleStartDM(myConn.userId, myConn.username)}
                          className="flex-1 bg-calm-green hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Message
                        </button>
                        <button
                          onClick={() => removeConnection(myConn.id)}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Connections;