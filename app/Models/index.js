let fs = require('file-system');
let path = require('path');

let sequelize = require('./connection').sequelize;
let Sequelize = require('./connection').Sequelize;

let db = {};


fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js" && file !== 'connection.js');
    })
    .forEach(function(file) {
        let model = sequelize.import(path.join(__dirname, file));

        db[model.name] = model;
    });


db.sequelize = sequelize;
db.Sequelize = Sequelize;

/**
 *
 *  ROADMAP RELATIONS
 *
 * */
db.roadmaps.belongsToMany(db.users, {through:'user_roadmaps', foreignKey: 'roadmap_id'});
db.roadmaps.belongsTo(db.users, {as:'Creator',foreignKey: 'creator_id'});
db.roadmaps.hasMany(db.roadmap_checkpoints, { foreignKey: 'roadmap_id' });


/**
 *
 *  ROADMAP CHECKPOINTS
 *
 * */
db.roadmap_checkpoints.belongsToMany(db.users, {through: 'user_checkpoints', foreignKey: 'checkpoint_id'});
db.roadmap_checkpoints.belongsTo(db.roadmaps, { foreignKey: 'roadmap_id' });
db.roadmap_checkpoints.hasMany(db.todos, {foreignKey: 'checkpoint_id'});

/**
 *
 *  TODOS
 *
 * */

db.todos.belongsToMany(db.users, {through: 'user_todos', foreignKey: 'todo_id'})
db.todos.hasMany(db.user_todos, {as:'todos_usertodos',foreignKey: 'todo_id'})



/**
 *
 * USERS
 *
 * */

db.users.belongsToMany(db.roadmaps, {through:'user_roadmaps', foreignKey: 'user_id'});
db.users.belongsToMany(db.roadmap_checkpoints, {through: 'user_checkpoints', foreignKey: 'user_id'});
db.users.belongsToMany(db.todos, {through: 'user_todos', foreignKey: 'user_id'});
//SKILLS
db.users.hasMany(db.userSkills, {foreignKey:'userId'});
db.users.hasMany(db.user_skills_logs, {foreignKey: 'userId'});
db.users.hasOne(db.user_settings, {foreignKey: 'userId'});

db.skills.belongsTo(db.skillsCategories, { foreignKey: 'categoryId' });
db.skills.hasOne(db.userSkills, { foreignKey: 'skillId' });

db.skillsCategories.hasMany(db.skills, {foreignKey: 'categoryId'})

db.userSkills.belongsTo(db.users, {foreignKey: 'userId'});
db.userSkills.belongsTo(db.skills, { foreignKey: 'skillId' });

db.userSkills.hasMany(db.user_skills_logs, {foreignKey: 'skillId'});

db.user_skills_logs.belongsTo(db.userSkills, {foreignKey: 'skillId'});
db.user_skills_logs.belongsTo(db.users, {foreignKey: 'userId'});

module.exports = db;