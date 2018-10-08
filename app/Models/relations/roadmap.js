module.exports = function (db) {
  db.roadmaps.belongsToMany(db.users, {through:'user_roadmaps', foreignKey: 'roadmap_id'});
  db.roadmaps.belongsTo(db.users, {as:'Creator',foreignKey: 'creator_id'});
  db.roadmaps.hasMany(db.roadmap_checkpoints, { foreignKey: 'roadmap_id' });
  db.roadmaps.belongsTo(db.skillsCategories, {foreignKey: 'category_id'});
  return db;
}
