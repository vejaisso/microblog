const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  departmentId: { type: DataTypes.INTEGER, allowNull: false },
  visible: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  timestamps: true
});

module.exports = Post;
