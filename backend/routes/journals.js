const express = require('express');
const router = express.Router();
const Journal = require('../models/Journal');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Journal prompts for inspiration
const JOURNAL_PROMPTS = [
  { id: 1, prompt: "What are you most grateful for today?", followUp: "How can you express this gratitude more often?", category: "gratitude" },
  { id: 2, prompt: "Describe a moment of peace you experienced recently.", followUp: "What created that sense of peace?", category: "mindfulness" },
  { id: 3, prompt: "What lesson has the universe been teaching you lately?", followUp: "How have you grown from this lesson?", category: "growth" },
  { id: 4, prompt: "Write about someone who has positively influenced your spiritual journey.", followUp: "What qualities do they embody?", category: "connection" },
  { id: 5, prompt: "What intention do you want to set for today?", followUp: "What actions will support this intention?", category: "intention" },
  { id: 6, prompt: "Describe a challenge you're currently facing.", followUp: "What wisdom might this challenge be offering?", category: "growth" },
  { id: 7, prompt: "What does your ideal day look like?", followUp: "How can you bring elements of this day into your current routine?", category: "vision" },
  { id: 8, prompt: "Write a letter to your future self.", followUp: "What hopes do you have for them?", category: "reflection" },
  { id: 9, prompt: "What makes your soul feel alive?", followUp: "When did you last feel this way?", category: "passion" },
  { id: 10, prompt: "Reflect on a recent dream or intuition.", followUp: "What message might it hold?", category: "intuition" },
  { id: 11, prompt: "What boundaries do you need to set or honor?", followUp: "Why are these boundaries important for your wellbeing?", category: "self-care" },
  { id: 12, prompt: "Describe your connection with nature.", followUp: "How does nature speak to you?", category: "nature" }
];

// Journal templates
const JOURNAL_TEMPLATES = [
  {
    id: 'morning_reflection',
    name: 'Morning Reflection',
    description: 'Start your day with intention and clarity',
    sections: [
      { title: 'Gratitude', prompt: 'What are 3 things you\'re grateful for this morning?' },
      { title: 'Intention', prompt: 'What do you want to focus on today?' },
      { title: 'Energy Check', prompt: 'How are you feeling physically, mentally, and spiritually?' },
      { title: 'Daily Affirmation', prompt: 'Write an affirmation for yourself today' }
    ]
  },
  {
    id: 'evening_review',
    name: 'Evening Review',
    description: 'Reflect on your day and prepare for rest',
    sections: [
      { title: 'Highlights', prompt: 'What were the best moments of today?' },
      { title: 'Challenges', prompt: 'What challenges did you face and how did you handle them?' },
      { title: 'Lessons', prompt: 'What did you learn today?' },
      { title: 'Tomorrow', prompt: 'What do you want to carry into tomorrow?' }
    ]
  },
  {
    id: 'gratitude_journal',
    name: 'Gratitude Journal',
    description: 'Focus on abundance and appreciation',
    sections: [
      { title: 'People', prompt: 'Who are you grateful for and why?' },
      { title: 'Experiences', prompt: 'What experiences brought you joy?' },
      { title: 'Growth', prompt: 'What personal growth are you thankful for?' },
      { title: 'Simple Pleasures', prompt: 'What small things made you smile?' }
    ]
  },
  {
    id: 'meditation_reflection',
    name: 'Meditation Reflection',
    description: 'Deepen your meditation practice',
    sections: [
      { title: 'Before Meditation', prompt: 'What state of mind are you bringing to this practice?' },
      { title: 'During Meditation', prompt: 'What did you experience during your meditation?' },
      { title: 'After Meditation', prompt: 'How do you feel now?' },
      { title: 'Insights', prompt: 'What insights or messages came through?' }
    ]
  },
  {
    id: 'dream_journal',
    name: 'Dream Journal',
    description: 'Record and explore your dreams',
    sections: [
      { title: 'Dream Content', prompt: 'Describe your dream in as much detail as possible' },
      { title: 'Feelings', prompt: 'What emotions did you experience in the dream?' },
      { title: 'Symbols', prompt: 'What symbols or themes stood out?' },
      { title: 'Interpretation', prompt: 'What might this dream be telling you?' }
    ]
  }
];

// Mood options
const MOOD_OPTIONS = [
  { value: 'peaceful', label: 'Peaceful', emoji: '😌', color: '#4CAF50' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏', color: '#9C27B0' },
  { value: 'joyful', label: 'Joyful', emoji: '😊', color: '#FFEB3B' },
  { value: 'loving', label: 'Loving', emoji: '💕', color: '#E91E63' },
  { value: 'inspired', label: 'Inspired', emoji: '✨', color: '#FF9800' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟', color: '#00BCD4' },
  { value: 'calm', label: 'Calm', emoji: '🧘', color: '#607D8B' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔', color: '#795548' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: '#FF5722' },
  { value: 'sad', label: 'Sad', emoji: '😢', color: '#3F51B5' },
  { value: 'angry', label: 'Angry', emoji: '😤', color: '#F44336' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', color: '#FF7043' },
  { value: 'tired', label: 'Tired', emoji: '😴', color: '#9E9E9E' },
  { value: 'confused', label: 'Confused', emoji: '😕', color: '#8BC34A' },
  { value: 'excited', label: 'Excited', emoji: '🤩', color: '#E040FB' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: '#BDBDBD' },
  { value: 'creative', label: 'Creative', emoji: '🎨', color: '#7C4DFF' }
];

// @route   GET /api/journals
// @desc    Get all journals for current user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page, limit, mood, search, startDate, endDate } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    const whereClause = { user_id: req.user.id };
    
    if (mood) {
      whereClause.mood = mood;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (startDate || endDate) {
      whereClause.entry_date = {};
      if (startDate) whereClause.entry_date[Op.gte] = startDate;
      if (endDate) whereClause.entry_date[Op.lte] = endDate;
    }

    const { count, rows: journals } = await Journal.findAndCountAll({
      where: whereClause,
      order: [['entry_date', 'DESC'], ['created_at', 'DESC']],
      limit: limitNum,
      offset: offset
    });

    // Add computed fields
    const processedJournals = journals.map(journal => {
      const journalJson = journal.toJSON();
      journalJson.word_count = journal.getWordCount();
      journalJson.tags_array = journal.tags || [];
      return journalJson;
    });

    res.json({
      success: true,
      data: {
        journals: processedJournals,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(count / limitNum),
          totalItems: count,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error fetching journals:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch journals' });
  }
});

// @route   GET /api/journals/stats
// @desc    Get journal statistics for current user
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Journal.getStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// @route   GET /api/journals/prompts
// @desc    Get journal prompts
// @access  Private
router.get('/prompts', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, data: { prompts: JOURNAL_PROMPTS } });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch prompts' });
  }
});

// @route   GET /api/journals/templates
// @desc    Get journal templates
// @access  Private
router.get('/templates', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, data: JOURNAL_TEMPLATES });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
});

// @route   GET /api/journals/moods
// @desc    Get mood options
// @access  Private
router.get('/moods', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, data: MOOD_OPTIONS });
  } catch (error) {
    console.error('Error fetching moods:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moods' });
  }
});

// @route   GET /api/journals/:id
// @desc    Get single journal by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const journal = await Journal.findByPk(req.params.id);
    
    if (!journal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }

    // Ensure user owns this journal
    if (journal.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const journalJson = journal.toJSON();
    journalJson.word_count = journal.getWordCount();
    journalJson.tags_array = journal.tags || [];

    res.json({ success: true, data: journalJson });
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch journal' });
  }
});

// @route   POST /api/journals
// @desc    Create a new journal entry
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, mood, tags, entry_date, template_used } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const journal = await Journal.create({
      user_id: req.user.id,
      title,
      content,
      mood,
      tags,
      entry_date: entry_date || new Date().toISOString().split('T')[0],
      template_used
    });

    const journalJson = journal.toJSON();
    journalJson.word_count = journal.getWordCount();
    journalJson.tags_array = journal.tags || [];

    res.status(201).json({ success: true, data: journalJson });
  } catch (error) {
    console.error('Error creating journal:', error);
    res.status(500).json({ success: false, message: 'Failed to create journal' });
  }
});

// @route   PUT /api/journals/:id
// @desc    Update a journal entry
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, mood, tags, entry_date, template_used } = req.body;

    // Check if journal exists and belongs to user
    const existingJournal = await Journal.findByPk(req.params.id);
    if (!existingJournal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }
    if (existingJournal.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await existingJournal.update({
      title,
      content,
      mood,
      tags,
      entry_date,
      template_used
    });

    const journalJson = existingJournal.toJSON();
    journalJson.word_count = existingJournal.getWordCount();
    journalJson.tags_array = existingJournal.tags || [];

    res.json({ success: true, data: journalJson });
  } catch (error) {
    console.error('Error updating journal:', error);
    res.status(500).json({ success: false, message: 'Failed to update journal' });
  }
});

// @route   DELETE /api/journals/:id
// @desc    Delete a journal entry
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if journal exists and belongs to user
    const existingJournal = await Journal.findByPk(req.params.id);
    if (!existingJournal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }
    if (existingJournal.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await existingJournal.destroy();
    res.json({ success: true, message: 'Journal deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal:', error);
    res.status(500).json({ success: false, message: 'Failed to delete journal' });
  }
});

// @route   GET /api/journals/export/:id
// @desc    Export single journal as PDF data
// @access  Private
router.get('/export/:id', authenticateToken, async (req, res) => {
  try {
    const journal = await Journal.findByPk(req.params.id);
    if (!journal) {
      return res.status(404).json({ success: false, message: 'Journal not found' });
    }
    if (journal.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const journalJson = journal.toJSON();
    journalJson.word_count = journal.getWordCount();
    journalJson.tags_array = journal.tags || [];

    res.json({ success: true, data: journalJson });
  } catch (error) {
    console.error('Error exporting journal:', error);
    res.status(500).json({ success: false, message: 'Failed to export journal' });
  }
});

// @route   GET /api/journals/export/all
// @desc    Export all journals as PDF data
// @access  Private
router.get('/export/all/data', authenticateToken, async (req, res) => {
  try {
    const journals = await Journal.findAll({
      where: { user_id: req.user.id },
      order: [['entry_date', 'DESC']]
    });

    const processedJournals = journals.map(journal => {
      const journalJson = journal.toJSON();
      journalJson.word_count = journal.getWordCount();
      journalJson.tags_array = journal.tags || [];
      return journalJson;
    });
    
    res.json({ success: true, data: processedJournals });
  } catch (error) {
    console.error('Error exporting journals:', error);
    res.status(500).json({ success: false, message: 'Failed to export journals' });
  }
});

module.exports = router;