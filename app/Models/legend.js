module.exports = function (sequelize,Sequelize) {
  return sequelize.define('disposition_legend', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: Sequelize.TEXT
    },
    value: {
      type: Sequelize.INTEGER
    }
  }, {
    timestamps: false,
    freezeTableName: true
  });
};
