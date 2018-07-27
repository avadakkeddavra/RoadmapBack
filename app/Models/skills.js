module.exports = function (sequelize,Sequelize) {
    return sequelize.define('skills', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: Sequelize.STRING(64)
        },
        description: {
            type: Sequelize.STRING(256)
        },
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
        categoryId: {
            type: Sequelize.INTEGER
        }
    }, {
        timestamps: false
    });
}
