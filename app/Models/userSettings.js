module.exports = function (sequelize,Sequelize) {
    return sequelize.define('user_settings', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        dev_years: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        projects_completed: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        createdAt: {
            type: Sequelize.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
            type: Sequelize.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        }
    });
};

