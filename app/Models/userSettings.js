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
            allowNull: false
        },
        projects_completed: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
    });
};

