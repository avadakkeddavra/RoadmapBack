module.exports = function (sequelize,Sequelize) {
    return sequelize.define('userSkills', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        mark: {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: false,
            defaultValue: 1
        },
        disposition: {
            type: Sequelize.SMALLINT.UNSIGNED,
            allowNull: false,
            defaultValue: 1
        },
        comment: {
            type: Sequelize.STRING(256)
        },
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        skillId: {
            type: Sequelize.INTEGER,
            allowNull: false
        }
    });
};

