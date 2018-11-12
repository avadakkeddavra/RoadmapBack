module.exports = function (sequelize,Sequelize) {
    return sequelize.define('mentorship', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        roadmap_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'roadmaps',
                key: 'id'
            }
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
        timestamps: false,
        freezeTableName: true,
    });
};
