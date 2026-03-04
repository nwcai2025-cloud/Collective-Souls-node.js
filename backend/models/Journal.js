const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Journal = sequelize.define('Journal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mood: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('tags');
      if (!raw) return [];
      return raw.split(',').map(t => t.trim()).filter(t => t);
    },
    set(val) {
      if (Array.isArray(val)) {
        this.setDataValue('tags', val.join(','));
      } else {
        this.setDataValue('tags', val);
      }
    }
  },
  entry_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  template_used: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'journals',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['entry_date']
    },
    {
      fields: ['mood']
    }
  ]
});

// Virtual field for word count
Journal.prototype.getWordCount = function() {
  return this.content ? this.content.split(/\s+/).filter(w => w).length : 0;
};

// Class method to get stats
Journal.getStats = async function(userId) {
  const { sequelize } = require('../config/database');
  
  // Total entries
  const totalEntries = await this.count({
    where: { user_id: userId }
  });

  // Total words (approximate)
  const entries = await this.findAll({
    where: { user_id: userId },
    attributes: ['content']
  });
  
  let totalWords = 0;
  entries.forEach(entry => {
    if (entry.content) {
      totalWords += entry.content.split(/\s+/).filter(w => w).length;
    }
  });

  // Entries this month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const entriesThisMonth = await this.count({
    where: {
      user_id: userId,
      entry_date: {
        [require('sequelize').Op.gte]: firstDayOfMonth
      }
    }
  });

  // Current streak
  const { Op } = require('sequelize');
  const streakEntries = await this.findAll({
    where: { user_id: userId },
    attributes: ['entry_date'],
    group: ['entry_date'],
    order: [['entry_date', 'DESC']],
    limit: 30
  });

  let currentStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < streakEntries.length; i++) {
    const entryDate = new Date(streakEntries[i].entry_date);
    entryDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);

    if (entryDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Mood distribution
  const moodDistribution = await this.findAll({
    where: {
      user_id: userId,
      mood: { [Op.ne]: null }
    },
    attributes: [
      'mood',
      [sequelize.fn('COUNT', sequelize.col('mood')), 'count']
    ],
    group: ['mood'],
    order: [[sequelize.literal('count'), 'DESC']]
  });

  return {
    totalEntries,
    totalWords,
    entriesThisMonth,
    currentStreak,
    moodDistribution: moodDistribution.map(m => ({
      mood: m.mood,
      count: parseInt(m.dataValues.count)
    }))
  };
};

// Association
Journal.associate = function(models) {
  Journal.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE'
  });
};

module.exports = Journal;