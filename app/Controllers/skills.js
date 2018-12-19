// Initialize response helper;
const responseHelper = require('../../helpers/response');
// Initialize models;
const globalModel =  require('./../Models/index');
const Skills = globalModel.skills;
const UserSkills = globalModel.userSkills;
const SkillsCategories = globalModel.skillsCategories;
const Roadmap = globalModel.roadmaps;
const Checkpoint = globalModel.checkpoints;

const skillLogs = globalModel.user_skills_logs;
const sequelize = globalModel.sequelize;
const Sequelize = globalModel.Sequelize;
const Op = globalModel.Sequelize.Op;
const Emitter = require('./../Events/OnSkillUpdate');

// Initialize skills class;
const skills = {};
// Initialize firebase;
const User = globalModel.users;
const Joi = require('joi');
const SkillsSchema = require('./../Validators/SkillsSchema');
const RoadmapService = require('./../Services/Roadmap');


skills.update = async function(Request, Response) {
  Skills.update(Request.body, {
    where:{
      id: Request.params.id
    }
  }).then(skill => {
    Response.send({success: skill[0]})
  }).catch(Error => {
    Response.send(400, Error.message);
  })
}


// Method for get skills data;
skills.getSkills = async function (request, response)
{
    let skillId = request.params.id;

    if(!skillId) {

        response.status(400);
        response.send({success:false,error:"Please set a skill id"});
        return;
    }

        Skills.findById(skillId,{
            include: [
                {model:SkillsCategories}
            ]
        })
        .then(skill => {
            response.send(skill);
        })
        .catch(E => {
            response.status(400);
            response.send(E);
        });
};

skills.delete = async function(Request, Response) {
    let deletableSkill = await Skills.findById(Request.params.id);

    if(deletableSkill) {
        deletableSkill.destroy();
        Response.send({ success: true, data: deletableSkill});
    } else{
        Response.status(400);
        Response.send({success: false, error: 'You can not delete unexisted category'});
    }
};

// Method for add skills;
skills.addSkills = async function (request, response)
{

    // Check request data;
    Joi.validate(request.body,SkillsSchema.add, async function(Error,Data){
        if(!Error)
        {

            if(!Data.disposition && !Data.mark && !Data.comment) {
                response.status(400);
                response.send({
                    success:false,
                    message:'No field to update'
                });
                return;
            }
            // Try create or update skill;
            let userSkills = await UserSkills.findOne({
                where: {
                    userId: request['body']['userId'],
                    skillId: request['body']['skillId']
                },
                include:[
                    {model:Skills,include:[SkillsCategories]},
                    {model:User}
                ]
            });

            if(userSkills)
            {
              if(Data.mark) {
                skillLogs.create({
                    userId:userSkills.userId,
                    skillId:userSkills.id,
                    skill_old: userSkills.mark,
                    skill_new: Data.mark
                });
              }


                let update = Data;
                delete update.skillId;
                delete update.userId;

                await userSkills.update(update);

                if(Data.disposition) {

                    Roadmap.findOne({
                        where: {
                            creator_id: request.auth.id,
                            hidden: 1,
                            category_id: userSkills.skill.skillsCategory.id
                        },
                        include: [Checkpoint]
                    }).then(roadmap => {
                    if(roadmap) {
                        let flag = false;
                        for(let check of roadmap.checkpoints) {
                            if(check.skill_id === userSkills.skillId) {
                                flag = true;

                                if( userSkills.disposition <= 6 ) {
                                    check.destroy();
                                }

                                break;
                            }
                        }

                        if(!flag && userSkills.disposition >= 6) {
                            RoadmapService.createCheckpoint({
                                name: 'Learning of '+userSkills.skill.title,
                                creator_id: request.auth.id,
                                roadmap_id: roadmap.id,
                                skill_id: userSkills.skillId
                            }).spread( (checkpoint, created) => {
                                console.log(checkpoint.id)
                                RoadmapService.createUserCheckpoint(request.auth.id,checkpoint.id, roadmap.id,roadmap.checkpoints.length +1)
                            })
                        }

                    }
                    }).catch( Error => {
                        response.send(Error.message)
                    })
                }

                response.send(userSkills);
            }else{
                response.status(400);
                response.send({
                    success:false,
                    message:'Such skill for this user does not exist or updates a same value'
                });
            }


        }else{
            response.send({success:false,error:Error});
            response.send(Error);
        }
    });
    return;

};

skills.getSkillsList = function (request, response)
{
    Skills.findAll({
        include: [
            {
                model:SkillsCategories
            }
        ]
    }).then((skills) =>
    {
        response.status(200);
        responseHelper.setResponseData(skills);
        responseHelper.sendResponse(response);
    });
};

skills.createNewSkill = async function (Request, Response)
{

    Joi.validate(Request.body, SkillsSchema.create, async function(Error, Data) {
        if(!Error) {

            let needSkill = await Skills.find({
                where: {
                    title: Data.title
                }
            });
            var skill = {};
            if(needSkill == null) {
                let newSkill = {
                    title: Data.title,
                    description: Data.description,
                    categoryId: Data.category_id
                };
                skill = await Skills.create(newSkill);
            } else {
                skill = await Skills.find({
                    id: needSkill['id']
                });
            }
            User.findAll().then(async (users) => {
                users.forEach((user) => {
                    UserSkills.findOrCreate({
                      where: {
                          userId: user.id,
                          mark: 1,
                          disposition: 1,
                          skillId: skill.id,
                          comment: ''
                      }
                    })
                })
            });
            Response.status(200);
            Response.send({success:true,data:skill});
        } else {
            Response.status(500);
            Response.send({success:false,error:Error.details});
        }
    });



}

skills.getCategoriesSkills = async function (request, response)
{

    try {
        let res = await SkillsCategories.findAll();
        response.send(res);
    } catch (error) {
        response.status(500);
        responseHelper.sendResponse(response);
    }

};

skills.getSkillsLogs = async function()
{
    var logSkills = await skillLogs.findAll({
       order:[
           ['updatedAt','DESC']
       ],
        raw: true,
        include:[UserSkills]
    });

    return JSON.stringify(logSkills);
};

skills.matched = async function (Request, Response) {

   var skills = Request.query.skills;

   if(skills === undefined) {
       skills = await Skills.findAll({
           attributes:['id']
       }).map(item => {
           return item.id;
       });
   }

   User.findAll({
        where:{
          role: 0
        },
       include:[
           {
               model:UserSkills,
               attributes:['mark'],
               where: {
                   skillId:skills
               },
               include: [
                   {
                       model:Skills,
                       attributes: ['id','title']
                   }
               ]
           }
       ],
   }).then(users => {

       if(users.length === 0) {
           Response.send({success:true,data:[]});
           return;
       }
      const UsersCompares = [];

      for(let i = 0; i < users.length; i++) {

          if(Request.query.userId && users[i].dataValues.id !== Number(Request.query.userId))
          {
              continue;
          }

          let currentUser = {
              id:users[i].dataValues.id,
              name:users[i].dataValues.name,
              userSkills: users[i].dataValues.userSkills,
              compare: []
          };


           for(let j = 0; j < users.length; j++) {
               for(let k = 0; k < skills.length; k++) {


                   let userMark = users[i].dataValues.userSkills[k];
                   let compareUserMark = users[j].dataValues.userSkills[k];

                   if( userMark && compareUserMark &&
                       ('dataValues' in userMark && 'dataValues' in compareUserMark) &&
                       ( userMark.dataValues.mark < compareUserMark.dataValues.mark )
                   )
                   {
                       currentUser.compare.push({name:users[j].dataValues.name,userSkills:compareUserMark});
                       break;
                   }
               }
           }

          UsersCompares.push(currentUser);
       }

       Response.send(UsersCompares)
   });
};

skills.getSkillsByCategories = async function(Request, Response){
    let skills = await SkillsCategories.findAll({
        include:[
            Skills
        ]
    });

    Response.send(skills);
};

skills.getLogs = async function(Request, Response) {

    Joi.validate(Request.body, SkillsSchema.logs, function(Error, Data) {
        if(!Error) {
            let page = 0;
            if(Request.query.page) {
                page = Request.query.page;
            }
            var offset = 0;
            if(page > 1){
                offset = (page - 1)*10;
            }
            if(Object.keys(Data).indexOf('createdAt') !== -1)
            {
                Data.createdAt = {
                   [Op.gte]:Data.createdAt
                }
            }

            if(Data.from && Data.to && Data.from !== '' && Data.to !== '')
            {
                Data.skill_new = {
                    [Op.between]: [Data.from, Data.to],
                };
                delete Data.from;
                delete Data.to;
            }

            let UserSkillsWhere = {};
            if(Data.skillId && Data.skillId.length > 0) {
                UserSkillsWhere.skillId = Data.skillId;
            }

            let where = Data;

            delete where.skillId;
            console.log(where);

            skillLogs.findAll({
                where: where,
                include: [
                    {
                        model:User
                    },
                    {
                        model:UserSkills,
                        attributes:['mark','skillId'],
                        where:UserSkillsWhere,
                        include:[
                            {
                                model:Skills,
                                attributes:['title'],
                                include:[
                                    {
                                        model:SkillsCategories,
                                        attributes:['title'],
                                    }
                                ]
                            }
                        ]
                    }
                ],
                limit: 10,
                offset: offset,
                order: [
                    ['userId','DESC']
                ]
            }).then( async (skills) => {

                let total = 0;

                if(UserSkillsWhere.skillId && Data.userId && UserSkillsWhere.skillId.length == 1) {
                    total = skills.length;
                } else {
                    total = await skillLogs.count({
                        where: Data,
                        include: [
                          {
                            model: UserSkills,
                            where: UserSkillsWhere
                          }
                        ]
                    });
                }

                Response.send({skills:skills, total: total})
            })

        } else {
            Response.status(400);
            Response.send({success:false, error: Error});
        }
    })
};

skills.sort = async function(Request, Response) {
  UserSkills.findAll({
      where: {
          userId: Request.body.userId
      },
      include: [
          {
            model: Skills,
            where: {
                categoryId: Request.body.id
            }
          }
      ]
  }).then(skills => {
      Response.send(skills);
  }).catch(Error => {
      Response.send(Error.message)
  })
};

skills.compare = async function(Request, Response) {

    let where = {
        userId: Request.body.userId
    };

    if(Request.body.skills.length !== 0) {
        where.skillId = Request.body.skills;
    }

    User.findById(Request.body.userId, {
        where: where,
        include: [
            {
                model:UserSkills,
                where: where,
                include: [Skills]
            }
        ]
    }).then( async user => {

        let where = {
            userId: {
                [Op.ne]: Request.body.userId,
            }
        };
        if(Request.body.skills.length !== 0) {
            where.skillId = Request.body.skills;
        }

        let skills = await UserSkills.findAll({
            where:where,
            include:[
                Skills,
                {
                    model:User,
                    where: {
                        role: 0,
                    },
                    include:{
                        model:UserSkills,
                        where:where,
                        include: [Skills]
                    }
                }
            ]
        });

        let compares = [];

        for(let userSkills of user.userSkills)
        {
            for(let skill of skills) {

                if( (userSkills.skill && skill.skill) &&
                    userSkills.skill.id === skill.skill.id &&
                    Number(userSkills.mark) < Number(skill.mark)
                ) {

                    console.log(skill.skill.id);
                    let user = findUser(compares, skill.user);

                    if(user === true) {
                        let compareUser = skill.user;
                        compareUser.dataValues.compareSkills = [];
                        compareUser.dataValues.compareSkills.push({
                            skill:skill.skill,
                            mark:skill.mark
                        });

                        compares.push(compareUser);
                    } else {
                        compares[user].dataValues.compareSkills.push({
                            skill:skill.skill,
                            mark:skill.mark
                        });
                    }

                }else{
                    continue;
                }


            }
        }

        Response.send({user:user,compare:compares});

    });


};

skills.search = function(Request, Response) {
  Skills.findAll({
      where:{
          title: {
              [Op.like]: '%'+Request.body.title+'%'
          }
      },
      include: [
          {
              model:SkillsCategories
          }
      ]
  }).then(skills => {
      Response.send(skills);
  }).catch( Error => {
      Response.send({error: Error.message});
  })
};

function findUser(data, user) {

    for(let key in data)
    {
        let item = data[key];
        if(item.name === user.name) {
            return key;
        } else {
            continue;
        }
    }

    return true;
}
module.exports = skills;
