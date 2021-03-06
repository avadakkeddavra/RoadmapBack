const GlobalModel = require('./../Models/index');
/*
 	MODELS
*/
const User = GlobalModel.users;
const Skill = GlobalModel.skills;
const UserSkill = GlobalModel.userSkills;
const SkillCategory = GlobalModel.skillsCategories;
const SkillLogs = GlobalModel.user_skills_logs;
const Op = GlobalModel.Sequelize.Op;
const sequelize = GlobalModel.sequelize;
/*
	VALIDATORS
*/
const Joi = require('joi');
const CategorySchema = require('./../Validators/CategorySchema');



const CategoryController = {
    create: function(Request, Response) {
        Joi.validate(Request.body, CategorySchema.create, function(Error, Data) {
            if(!Error) {

                SkillCategory.create(Data)
                    .then( category => {
                        Response.send({success: true, data: category});
                    })
                    .catch( Error => {
                        Response.status(400);
                        Response.send({success: false, error: Error.errors});
                    })

            } else {
                Response.status(400);
                Response.send({success: false, error: Error.details});
            }
        });
    },
    update: function(Request, Response) {
        Joi.validate(Request.body, CategorySchema.update, function(Error, Data) {
            if(!Error) {
                SkillCategory.findById(Request.params.id)
                    .then( category => {
                        category.update(Data)
                            .then( category => {
                                Response.send({success: true, data: category});
                            })
                    })
                    .catch( Error => {
                        Response.status(400);
                        Response.send({success: false, error: Error});
                    });
            } else {

            }
        });
    },
    delete: async function(Request, Response) {
        let deletableCategory = await SkillCategory.findById(Request.params.id);

        if(deletableCategory) {
            deletableCategory.destroy();
            Response.send({ success: true, data: deletableCategory});
        } else{
            Response.status(400);
            Response.send({success: false, error: 'You can not delete unexisted category'});
        }
    },
    getSingle: async function(Request, Response) {
        let category = await SkillCategory.findById(Request.params.id);
        Response.send({success: true, data: category})
    },
    getAll: async function(Request, Response) {
        let categories = await SkillCategory.findAll({include:[{model:Skill}]});
        Response.send({success: true, data: categories})
    },
    getUserCategoryStat: function(Request, Response) {
        SkillCategory.findAll({
            include: [
                {
                    model:Skill,
                    attributes: {include:[[sequelize.fn('COUNT', sequelize.col('skills.id')), 'count']]},
                    where: {
                      id: {
                        [Op.ne]: null
                      }
                    },
                    include:[
                        {
                           model: UserSkill,
                           where: {
                               userId: Request.params.id
                           },
                           attributes: ['userId',[sequelize.fn('SUM', sequelize.col('mark')), 'marks']]
                        }
                    ]
                }
            ],
            group:['skillsCategories.id']
        }).then(skills => {
            for(let i in skills) {
              let skill = skills[i];
              if(skill.skills.length === 0) {
                skills.splice(i,1);
              }
            }

            for(let i in skills) {
              let skill = skills[i];
                let mark = Number(skill.skills[0].userSkills[0].dataValues['marks']);
                let middleValue = Number(skill.skills[0].dataValues.count) * 3;
                let highValue = Number(skill.skills[0].dataValues.count)* 6;
                skill.dataValues['values'] = {
                  middle: middleValue,
                  high: highValue
                };
                console.log(middleValue)
                if(mark < middleValue) {
                    skill.dataValues['level'] = {
                      value: 'junior',
                      color: 'grey'
                    };
                } else if(mark >= middleValue && mark < highValue) {
                    skill.dataValues['level'] = {
                        value: 'middle',
                        color: 'orange'
                    };
                } else {
                    skill.dataValues['level'] = {
                        value: 'senior',
                        color: 'teal'
                    };
                }
            }

            Response.send(skills);
        }).catch(Error => {
          Response.send(400, {error: Error.message})
        });
    },
    search: function(Request, Response) {
        SkillCategory.findAll({
            where: {
                title: {
                    [Op.like]: '%'+Request.body.title+'%'
                }
            }
        }).then(categories => {
            Response.send(categories);
        }).catch(Error => {
            Response.send({error: Error.message})
        })
    }
};

module.exports = CategoryController;
