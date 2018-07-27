module.exports = function (sequelize,Sequelize) {
    return sequelize.define('user_skills_logs', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        skill_old: {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: false
        },
        skill_new: {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: false
        },
        skillId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        createdAt: {
            type:Sequelize.DATE,
        }
    });
}

