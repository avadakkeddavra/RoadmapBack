module.exports = function (db) {

    db.users.hasMany(db.roadmaps, {as:'created_checkpoints',foreignKey:'creator_id' });
    db.users.belongsToMany(db.roadmaps, {through:'user_roadmaps', foreignKey: 'user_id'});
    db.users.belongsToMany(db.checkpoints, {through: 'user_checkpoints', foreignKey: 'user_id'});
    db.users.belongsToMany(db.todos, {through: 'user_todos', foreignKey: 'user_id'});
    db.users.hasMany(db.todos, {as:'owner_todos', foreignKey: 'creator_id'});
    //SKILLS
    db.users.hasMany(db.userSkills, {foreignKey:'userId'});
    db.users.hasMany(db.user_skills_logs, {foreignKey: 'userId'});
    db.users.hasOne(db.user_settings, {foreignKey: 'userId'});
    
  }
   