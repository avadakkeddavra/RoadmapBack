// Initialize response helper;
const responseHelper = require('../../helpers/response');
// Initialize models;
const globalModel =  require('./../Models/index');
const Skills = globalModel.skills;
const UserSkills = globalModel.userSkills;
const SkillsCategories = globalModel.skillsCategories;

const skillLogs = globalModel.user_skills_logs;
const sequelize = globalModel.sequelize;
const Sequelize = globalModel.Sequelize;
const Op = globalModel.Sequelize.Op;
const Emitter = require('./../Events/OnSkillUpdate');

// Initialize skills class;
const skills = {};
// Initialize firebase;
const firebase = require('firebase-admin');
const User = globalModel.users;
const Joi = require('joi');
const SkillsSchema = require('./../Validators/SkillsSchema');


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

                if(!Data.disposition && !Data.mark) {
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
                    skillLogs.create({
                        userId:userSkills.userId,
                        skillId:userSkills.id,
                        skill_old: userSkills.mark,
                        skill_new: Data.mark
                    });

                    if(Data.disposition)
                    {
                        var update = {
                            disposition: Data.disposition
                        }
                    }else{
                        var update = {
                            mark:Data.mark,
                        }
                    }

                    await userSkills.update(update);
                    Emitter.emit('update_skill');
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
    Skills.findAll().then((skills) =>
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
            Response.status(200);
            Response.send({success:true,data:skill});
        } else {
            Response.status(500);
            Response.send({success:false,error:Error});
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
                }
                delete Data.from;
                delete Data.to;
            }
            skillLogs.findAll({
                where: Data,
                include: [
                    {
                        model:User
                    },
                    {
                        model:UserSkills,
                        attributes:['mark'],
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
                ]
            }).then(skills => {
                Response.send(skills)
            })

        } else {
            Response.status(400);
            Response.send({success:false, error: Error});
        }
    })
}

module.exports = skills;
