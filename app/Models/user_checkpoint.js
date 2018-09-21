module.exports = function (sequelize,Sequelize) {
    return sequelize.define('user_checkpoints', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        checkpoint_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        roadmap_id : {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        checked: {
            type: Sequelize.TINYINT,
            defaultValue: 0
        },
        index_number: {
            type: Sequelize.INTEGER
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
