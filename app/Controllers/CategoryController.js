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
                        Response.send({success: false, error: Error});
                    })

            } else {
                Response.status(400);
                Response.send({success: false, error: Error});
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
        let categories = await SkillCategory.findAll();
        Response.send({success: true, data: categories})
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