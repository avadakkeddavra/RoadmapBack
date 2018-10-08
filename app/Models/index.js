let fs = require('file-system');
let path = require('path');

let sequelize = require('./connection').sequelize;
let Sequelize = require('./connection').Sequelize;

let db = {};

fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js" && file !== 'connection.js' && file !== 'relations');
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
 require('./relations/roadmap.js')(db);

/**
 *
 *  ROADMAP CHECKPOINTS
 *
 * */
require('./relations/checkpoints.js')(db);
/**
 *
 *  TODOS
 *
 * */

db.todos.belongsToMany(db.users, {through: 'user_todos', foreignKey: 'todo_id'})
db.todos.hasMany(db.user_todos, {as:'todos_usertodos',foreignKey: 'todo_id'})
db.todos.belongsTo(db.users, {as:'creator', foreignKey:'creator_id'})

/**
 *
 * USERS
 *
 * */
db.users.hasMany(db.roadmaps, {as:'created_checkpoints',foreignKey:'creator_id' });
db.users.belongsToMany(db.roadmaps, {through:'user_roadmaps', foreignKey: 'user_id'});
db.users.belongsToMany(db.roadmap_checkpoints, {through: 'user_checkpoints', foreignKey: 'user_id'});
db.users.belongsToMany(db.todos, {through: 'user_todos', foreignKey: 'user_id'});
db.users.hasMany(db.todos, {as:'owner_todos', foreignKey: 'creator_id'});

//SKILLS
db.users.hasMany(db.userSkills, {foreignKey:'userId'});
db.users.hasMany(db.user_skills_logs, {foreignKey: 'userId'});
db.users.hasOne(db.user_settings, {foreignKey: 'userId'});

db.skills.belongsTo(db.skillsCategories, { foreignKey: 'categoryId' });
db.skills.hasMany(db.userSkills, { foreignKey: 'skillId' });
db.skills.hasMany(db.roadmap_checkpoints, { foreignKey: 'skill_id' });


db.skillsCategories.hasMany(db.skills, {foreignKey: 'categoryId'});
db.skillsCategories.hasMany(db.roadmaps, {foreignKey: 'category_id'});


db.userSkills.belongsTo(db.users, {foreignKey: 'userId'});
db.userSkills.belongsTo(db.skills, { foreignKey: 'skillId' });

db.userSkills.hasMany(db.user_skills_logs, {foreignKey: 'skillId'});

db.user_skills_logs.belongsTo(db.userSkills, {foreignKey: 'skillId'});
db.user_skills_logs.belongsTo(db.users, {foreignKey: 'userId'});

module.exports = db;
