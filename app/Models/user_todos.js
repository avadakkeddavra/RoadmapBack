module.exports = function (sequelize,Sequelize) {
    return sequelize.define('user_todos', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        user_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        todo_id: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        checked: {
            type: Sequelize.TINYINT,
            defaultValue: 0
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
