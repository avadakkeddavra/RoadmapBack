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