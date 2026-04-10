const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Department = require('./Department');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('USER', 'ADMIN'), defaultValue: 'USER' },
  departmentId: { type: DataTypes.INTEGER, references: { model: Department, key: 'id' } }
}, {
  timestamps: true
});

User.belongsTo(Department, { foreignKey: 'departmentId' });

module.exports = User;
