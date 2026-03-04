import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Clock,
  FileText,
  Sparkles,
  Heart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bell,
  BellOff,
  Loader,
  AlertCircle
} from 'lucide-react';
import {
  fetchJournals,
  fetchJournalStats,
  fetchPrompts,
  fetchTemplates,
  fetchMoods,
  createJournal,
  updateJournal,
  deleteJournal,
  exportJournalPdf,
  exportAllJournals,
  generatePdf,
  generateAllJournalsPdf
} from '../services/journalService';

const Journal = () => {
  const { user } = useAuth();
  
  // State
  const [journals, setJournals] = useState([]);
  const [stats, setStats] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination and filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [viewingJournal, setViewingJournal] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
    tags: '',
    entry_date: new Date().toISOString().split('T')[0]
  });
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateSections, setTemplateSections] = useState({});
  
  // Reminder state
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  
  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadReminderSettings();
  }, []);
  
  // Load journals when filters change
  useEffect(() => {
    loadJournals();
  }, [page, selectedMood]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsRes, promptsRes, templatesRes, moodsRes] = await Promise.all([
        fetchJournalStats(),
        fetchPrompts(),
        fetchTemplates(),
        fetchMoods()
      ]);
      
      if (statsRes.success) setStats(statsRes.data);
      if (promptsRes.success) setPrompts(promptsRes.data.prompts);
      if (templatesRes.success) setTemplates(templatesRes.data);
      if (moodsRes.success) setMoods(moodsRes.data);
      
      await loadJournals();
    } catch (err) {
      setError('Failed to load journal data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadJournals = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const filters = {
        page,
        limit: 10,
        ...(selectedMood && { mood: selectedMood }),
        ...(searchTerm && { search: searchTerm })
      };
      
      const res = await fetchJournals(filters);
      
      if (res.success) {
        setJournals(res.data.journals);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error loading journals:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  const loadReminderSettings = () => {
    const savedReminder = localStorage.getItem('journalReminder');
    if (savedReminder) {
      const settings = JSON.parse(savedReminder);
      setReminderEnabled(settings.enabled);
      setReminderTime(settings.time);
    }
  };
  
  const saveReminderSettings = () => {
    localStorage.setItem('journalReminder', JSON.stringify({
      enabled: reminderEnabled,
      time: reminderTime
    }));
    
    if (reminderEnabled && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Journal Reminder Set', {
            body: `You'll be reminded daily at ${reminderTime} to write in your journal.`,
            icon: '/favicon.ico'
          });
        }
      });
    }
  };
  
  // Request notification permission for reminders
  useEffect(() => {
    if (reminderEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [reminderEnabled]);
  
  // Check for reminder notification
  useEffect(() => {
    if (!reminderEnabled) return;
    
    const checkReminder = () => {
      const now = new Date();
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const reminderDate = new Date(now);
      reminderDate.setHours(hours, minutes, 0, 0);
      
      const lastReminder = localStorage.getItem('lastJournalReminder');
      const today = now.toDateString();
      
      if (
        now >= reminderDate &&
        now <= new Date(reminderDate.getTime() + 60000) &&
        lastReminder !== today &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification('Time to Journal! 📔', {
          body: 'Take a moment to reflect on your spiritual journey today.',
          icon: '/favicon.ico'
        });
        localStorage.setItem('lastJournalReminder', today);
      }
    };
    
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime]);
  
  // Form handlers
  const handleCreateNew = () => {
    setEditingJournal(null);
    setFormData({
      title: '',
      content: '',
      mood: '',
      tags: '',
      entry_date: new Date().toISOString().split('T')[0]
    });
    setSelectedPrompt(null);
    setSelectedTemplate(null);
    setTemplateSections({});
    setShowModal(true);
  };
  
  const handleEdit = (journal) => {
    setEditingJournal(journal);
    setFormData({
      title: journal.title || '',
      content: journal.content,
      mood: journal.mood || '',
      tags: journal.tags || '',
      entry_date: journal.entry_date
    });
    setSelectedPrompt(null);
    setSelectedTemplate(null);
    setTemplateSections({});
    setShowModal(true);
  };
  
  const handleView = (journal) => {
    setViewingJournal(journal);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this journal entry? This cannot be undone.')) {
      return;
    }
    
    const res = await deleteJournal(id);
    if (res.success) {
      setJournals(journals.filter(j => j.id !== id));
      if (stats) {
        setStats({ ...stats, totalEntries: stats.totalEntries - 1 });
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let content = formData.content;
    
    // If using template, compile sections into content
    if (selectedTemplate && Object.keys(templateSections).length > 0) {
      const template = templates.find(t => t.id === selectedTemplate);
      content = template.sections.map((section, idx) => {
        const sectionContent = templateSections[idx] || '';
        return `## ${section.title}\n${sectionContent}`;
      }).join('\n\n');
    }
    
    const data = {
      title: formData.title,
      content,
      mood: formData.mood,
      tags: formData.tags,
      entry_date: formData.entry_date,
      template_used: selectedTemplate || null
    };
    
    try {
      if (editingJournal) {
        const res = await updateJournal(editingJournal.id, data);
        if (res.success) {
          setJournals(journals.map(j => j.id === editingJournal.id ? res.data : j));
          setShowModal(false);
          toast.success('Journal entry updated!');
        } else {
          toast.error(res.message || 'Failed to update entry');
        }
      } else {
        const res = await createJournal(data);
        if (res.success) {
          setJournals([res.data, ...journals]);
          if (stats) {
            setStats({ ...stats, totalEntries: stats.totalEntries + 1 });
          }
          setShowModal(false);
          toast.success('Journal entry saved!');
        } else {
          toast.error(res.message || 'Failed to save entry');
        }
      }
    } catch (error) {
      console.error('Error saving journal:', error);
      toast.error('Failed to save journal entry. Please try again.');
    }
  };
  
  const handleExportOne = async (id) => {
    const res = await exportJournalPdf(id);
    if (res.success) {
      generatePdf(res.data);
    }
  };
  
  const handleExportAll = async () => {
    const res = await exportAllJournals();
    if (res.success) {
      generateAllJournalsPdf(res.data);
    }
  };
  
  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      ...formData,
      content: '' // Start with empty content - prompt shows as header
    });
  };
  
  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      const sections = {};
      template.sections.forEach((_, idx) => {
        sections[idx] = '';
      });
      setTemplateSections(sections);
      setFormData({
        ...formData,
        title: formData.title || template.name
      });
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadJournals();
  };
  
  const getMoodInfo = (moodValue) => {
    return moods.find(m => m.value === moodValue);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mindful-purple via-purple-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-mindful-purple to-serene-blue rounded-2xl p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                  <span>📔</span> My Spiritual Journal
                </h1>
                <p className="text-white text-opacity-90 text-sm sm:text-base">
                  Your private space for reflection and spiritual growth
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <button 
                  onClick={() => loadJournals(true)}
                  disabled={refreshing}
                  className="p-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button 
                  onClick={handleCreateNew}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 sm:px-6 py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span className="sm:hidden">New</span>
                  <span className="hidden sm:inline">New Entry</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-mindful-purple bg-opacity-10 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-mindful-purple" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Entries</p>
                  <p className="text-xl sm:text-2xl font-bold text-mindful-purple">{stats.totalEntries}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-serene-blue bg-opacity-10 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-serene-blue" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Words</p>
                  <p className="text-xl sm:text-2xl font-bold text-serene-blue">{stats.totalWords.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-calm-green bg-opacity-10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-calm-green" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">This Month</p>
                  <p className="text-xl sm:text-2xl font-bold text-calm-green">{stats.entriesThisMonth}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 bg-opacity-10 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Streak</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-500">{stats.currentStreak} days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100 mb-6">
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search your journals..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-mindful-purple focus:ring-2 focus:ring-mindful-purple focus:ring-opacity-20 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 bg-mindful-purple text-white rounded-xl font-bold hover:bg-purple-700 transition-all"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-xl border ${showFilters ? 'bg-gray-100 border-gray-300' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </form>
            
            {showFilters && (
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Mood</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:border-mindful-purple outline-none"
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                  >
                    <option value="">All Moods</option>
                    {moods.map(mood => (
                      <option key={mood.value} value={mood.value}>
                        {mood.emoji} {mood.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleExportAll}
                    className="px-4 py-2 bg-calm-green text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {reminderEnabled ? (
                <Bell className="w-5 h-5 text-mindful-purple" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-bold text-gray-900">Daily Reminder</p>
                <p className="text-sm text-gray-500">
                  {reminderEnabled ? `Remind me at ${reminderTime}` : 'Reminders disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {reminderEnabled && (
                <input
                  type="time"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  onBlur={saveReminderSettings}
                />
              )}
              <button
                onClick={() => {
                  setReminderEnabled(!reminderEnabled);
                  setTimeout(saveReminderSettings, 100);
                }}
                className={`relative w-12 h-6 rounded-full transition-colors ${reminderEnabled ? 'bg-mindful-purple' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${reminderEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Journal Entries */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 text-mindful-purple animate-spin mb-4" />
            <p className="text-gray-600 font-bold">Loading your journals...</p>
          </div>
        ) : journals.length > 0 ? (
          <div className="space-y-4">
            {journals.map((journal) => {
              const moodInfo = getMoodInfo(journal.mood);
              return (
                <div 
                  key={journal.id} 
                  className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-purple-100 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => handleView(journal)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {moodInfo && (
                          <span className="text-xl">{moodInfo.emoji}</span>
                        )}
                        <h3 className="font-bold text-lg text-gray-900">
                          {journal.title || 'Untitled Entry'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(journal.entry_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {journal.word_count} words
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(journal)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExportOne(journal.id)}
                        className="p-2 text-gray-400 hover:text-calm-green hover:bg-green-50 rounded-lg transition-all"
                        title="Export PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(journal.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {journal.content}
                  </p>
                  {journal.tags_array && journal.tags_array.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {journal.tags_array.map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-xs bg-purple-100 text-mindful-purple px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-white border border-gray-200 rounded-xl">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-20 text-center border border-dashed border-gray-300">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Journey</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Your spiritual journal is a private space for reflection, growth, and gratitude. 
              Begin your first entry today.
            </p>
            <button 
              onClick={handleCreateNew}
              className="bg-mindful-purple text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Write First Entry
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-gray-50 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-mindful-purple to-indigo-600 p-4 sm:p-6 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {editingJournal ? 'Edit Entry' : 'New Journal Entry'}
                </h3>
                <p className="text-white text-opacity-80 text-sm">
                  Your thoughts are private and secure
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Prompts Section */}
              {!editingJournal && !selectedTemplate && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Need inspiration? Try a prompt:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {prompts.slice(0, 4).map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => handlePromptSelect(prompt)}
                        className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${
                          selectedPrompt?.id === prompt.id
                            ? 'border-mindful-purple bg-purple-50'
                            : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium text-gray-900">{prompt.prompt.slice(0, 50)}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Templates Section */}
              {!editingJournal && !selectedPrompt && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-serene-blue" />
                    Or use a template:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          selectedTemplate === template.id
                            ? 'border-serene-blue bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium text-gray-900 text-sm">{template.name}</span>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Title (optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all"
                    placeholder="Give your entry a title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Mood</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all"
                      value={formData.mood}
                      onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                    >
                      <option value="">How are you feeling?</option>
                      {moods.map(mood => (
                        <option key={mood.value} value={mood.value}>
                          {mood.emoji} {mood.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Template Sections */}
                {selectedTemplate && templates.find(t => t.id === selectedTemplate)?.sections.map((section, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{section.title}</label>
                    <p className="text-xs text-gray-500 mb-1">{section.prompt}</p>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all"
                      rows={3}
                      value={templateSections[idx] || ''}
                      onChange={(e) => setTemplateSections({ ...templateSections, [idx]: e.target.value })}
                    />
                  </div>
                ))}
                
                {/* Selected Prompt Display */}
                {selectedPrompt && !selectedTemplate && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-800 mb-1">Writing Prompt</p>
                        <p className="text-gray-700 font-medium">{selectedPrompt.prompt}</p>
                        {selectedPrompt.followUp && (
                          <p className="text-gray-500 text-sm mt-2 italic">{selectedPrompt.followUp}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPrompt(null);
                          setFormData({ ...formData, content: '' });
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Clear prompt"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Regular Content */}
                {!selectedTemplate && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      {selectedPrompt ? 'Your Response' : 'Your Thoughts'}
                    </label>
                    <textarea
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all min-h-[200px]"
                      placeholder={selectedPrompt ? "Start writing your response..." : "Write freely... This is your private space."}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tags (optional)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mindful-purple outline-none transition-all"
                    placeholder="gratitude, meditation, growth (comma separated)"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-mindful-purple hover:bg-purple-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all transform active:scale-[0.98]"
                >
                  {editingJournal ? 'Update Entry' : 'Save Entry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingJournal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-mindful-purple to-serene-blue p-4 sm:p-6 text-white flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {viewingJournal.title || 'Journal Entry'}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-white text-opacity-90">
                  <span>{formatDate(viewingJournal.entry_date)}</span>
                  <span>•</span>
                  <span>{viewingJournal.word_count} words</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getMoodInfo(viewingJournal.mood) && (
                  <span className="text-3xl">{getMoodInfo(viewingJournal.mood).emoji}</span>
                )}
                <button 
                  onClick={() => setViewingJournal(null)}
                  className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="prose prose-purple max-w-none">
                <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {viewingJournal.content}
                </p>
              </div>
              
              {viewingJournal.tags_array && viewingJournal.tags_array.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {viewingJournal.tags_array.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="text-sm bg-purple-100 text-mindful-purple px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {viewingJournal.template_used && (
                <div className="mt-4 text-sm text-gray-500">
                  Template: {templates.find(t => t.id === viewingJournal.template_used)?.name || viewingJournal.template_used}
                </div>
              )}
            </div>
            
            {/* Footer Actions */}
            <div className="flex gap-3 p-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => {
                  setViewingJournal(null);
                  handleEdit(viewingJournal);
                }}
                className="flex-1 py-3 bg-mindful-purple text-white rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleExportOne(viewingJournal.id)}
                className="flex-1 py-3 bg-calm-green text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;