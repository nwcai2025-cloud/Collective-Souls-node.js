const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Donation = sequelize.define('Donation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    allowNull: false,
    validate: {
      len: [3, 3]
    }
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  payment_gateway: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  gateway_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  gateway_response: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  donor_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  donor_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 500]
    }
  },
  is_recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurring_interval: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    onUpdate: DataTypes.NOW
  }
}, {
  tableName: 'donations',
  timestamps: false,
  hooks: {
    beforeUpdate: (donation) => {
      donation.updated_at = new Date();
    }
  }
});

// Associations
Donation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Donation, { foreignKey: 'user_id', as: 'donations' });

module.exports = Donation;