module.exports = function (db) {
  db.checkpoints.belongsToMany(db.users, {through: 'user_checkpoints', foreignKey: 'checkpoint_id'});
  db.checkpoints.hasMany(db.user_checkpoints, {as:'user_checlpoints', foreignKey: 'checkpoint_id'});
  db.checkpoints.belongsTo(db.roadmaps, { foreignKey: 'roadmap_id' });
  db.checkpoints.belongsTo(db.users, {as:'creator', foreignKey: 'creator_id' });
  db.checkpoints.hasMany(db.todos, {foreignKey: 'checkpoint_id'});
  db.checkpoints.belongsTo(db.skills, {foreignKey: 'skill_id'});
  return db;
}
