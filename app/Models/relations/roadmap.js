module.exports = function (db) {
  db.roadmaps.belongsToMany(db.users, {through:'user_roadmaps', foreignKey: 'roadmap_id'});
  db.roadmaps.belongsTo(db.users, {as:'Creator',foreignKey: 'creator_id'});
  db.roadmaps.hasMany(db.checkpoints, { foreignKey: 'roadmap_id' });
  db.roadmaps.belongsTo(db.skillsCategories, {foreignKey: 'category_id'});
  db.roadmaps.hasMany(db.user_todos, {foreignKey: 'roadmap_id'});
  db.roadmaps.belongsToMany(db.users, {through:'mentorship', as:'mentor', foreignKey:'roadmap_id'})
}
 