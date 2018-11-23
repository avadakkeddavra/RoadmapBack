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
            allowNull: false,
            references: {
                model: 'todos',
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
        checked: {
            type: Sequelize.TINYINT,
            defaultValue: 0
        },
        index_number : {
            type: Sequelize.INTEGER,
            defaultValue: 1
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
