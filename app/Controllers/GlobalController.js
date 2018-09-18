
const GlobalModel = require('./../Models/index');
/*
 	MODELS
*/
const User = GlobalModel.users;
const Skill = GlobalModel.skills;
const UserSkill = GlobalModel.userSkills;
const SkillCategory = GlobalModel.skillsCategories;
const SkillLogs = GlobalModel.user_skills_logs;
const UserSettings = GlobalModel.user_settings;
const sequelize = GlobalModel.sequelize;
/*
	VALIDATORS
*/
const UserSchemas = require('./../Validators/UserSchema');
const Joi = require('joi');


const GlobalController = {
  getStats: async function(Request, Response) {
      let skillsCount = await Skill.count()
      let totalMarks = await UserSkill.sum('mark');
      UserSkill.findAll({
          attributes:['userId',[sequelize.fn('SUM', sequelize.col('mark')), 'total']],
          group:['userSkills.userId'],
          include:[{
              model:User,
              where: {
                  role: 0
              }
          }]
      }).then(users => {

          let usersStat = {
              junior: 0,
              middle: 0,
              senior: 0
          };

          let middleValue = Math.round(skillsCount*10/3);
          let highValue = middleValue*2;

          for(let user of users) {

              if(user.dataValues.total < middleValue) {
                    usersStat.junior++;
              } else if(user.dataValues.total >= middleValue && user.dataValues.total < highValue) {
                  usersStat.middle++;
              } else {
                  usersStat.senior++;
              }
          }

          Response.send({
              skills:skillsCount,
              total:totalMarks,
              usersStat,
          });
      })
  }
};
module.exports = GlobalController;