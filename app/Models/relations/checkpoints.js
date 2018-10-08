module.exports = function (db) {
  db.roadmap_checkpoints.belongsToMany(db.users, {through: 'user_checkpoints', foreignKey: 'checkpoint_id'});
  db.roadmap_checkpoints.belongsTo(db.roadmaps, { foreignKey: 'roadmap_id' });
  db.roadmap_checkpoints.belongsTo(db.users, {as:'creator', foreignKey: 'creator_id' });
  db.roadmap_checkpoints.hasMany(db.todos, {foreignKey: 'checkpoint_id'});
  db.roadmap_checkpoints.belongsTo(db.skills, {foreignKey: 'skill_id'});
  
  return db;
}
