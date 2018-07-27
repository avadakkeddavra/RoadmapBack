module.exports = function (sequelize,Sequelize) {
    return sequelize.define('skillsCategories', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: Sequelize.STRING(64),
            unique:true
        },
        description: {
            type: Sequelize.STRING(256)
        },
        date: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false
    });
};
