module.exports = function (sequelize,Sequelize) {
    return sequelize.define('roadmaps', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING(256)
        },
        description: {
            type: Sequelize.STRING,
            allowNull: true
        },
        creator_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        hidden: {
            type: Sequelize.BOOLEAN,
            defaultValue: 0
        },
        category_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
            type: Sequelize.DATE,
            defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
        },
    }, {
        timestamps: false
    });
};
