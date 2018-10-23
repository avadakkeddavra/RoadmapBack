module.exports = function (sequelize,Sequelize) {
    return sequelize.define('checkpoints', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING(256)
        },
        creator_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        skill_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        roadmap_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        description: {
          type:Sequelize.TEXT,
          allowNull: true
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
