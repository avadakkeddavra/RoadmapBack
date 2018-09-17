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

/*
	JWT AND LIBS
*/
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserController = {

	login:function(Request,Response)
	{
		Joi.validate(Request.body,UserSchemas.login,function(Error,Data){
			if(!Error)
			{
				User.findOne({
					where:{
						email:Data.email,
						password:bcrypt.hashSync(Data.password, process.env.SALT)
					}
					
				})
				.then(user => {
					if(user)
					{
						var token = jwt.sign({
						name:user.name,
						id:user.id,
						email:user.email,
						role:user.role,
						avatar: user.avatar
					},process.env.JWT_KEY);

						Response.send({success: true, token: token});
						
					}else{
						Response.status(400);
						Response.send({success:false,error:'Invalid password or email'});
					}
					
				})
				.catch(E => {
					Response.status(400);
					Response.send({success:false,error:Error})
				});
			}else{
				Response.status(400);
				Response.send({success:false,error:Error})
			}
		})
	},

    register: function (Request,Response)
    {
        Joi.validate(Request.body,UserSchemas.register,function(Error,Data){
            if(!Error)
            {

                var hash = bcrypt.hashSync(Data.password, process.env.SALT);

                User.create({
                    name: Data.name,
                    email: Data.email,
                    password: hash
                }).then(user => {

                    var token = jwt.sign({
                        name:user.name,
                        id:user.id,
                        email:user.email
                    },process.env.JWT_KEY);

                    Skill.findAll().then( async skills => {
                        let userSkills = [];

                        for(let skill of skills)
                        {
                            userSkills.push({
                                userId: user.id,
                                mark: 1,
                                skillId: skill.id
                            });
                        }

                        await UserSkill.bulkCreate(userSkills);

                        Response.send({success:true,token: token});
                    });
                })
                    .catch(E => {
                        Response.status(400);
                        Response.send({success:false,error:E});
                    });



            }else{
                Response.status(400);
                Response.send({success: false, error: Error});
            }
        });
    },
	isAdmin: async function (Request,Response){
        if(Request.auth.role === 1)
		{
            Response.send({isAdmin:true});
		}else{
            Response.send({isAdmin:false});
		}

	},
	getUser: async function(Request, Response) {

		let user = await User.findById(Request.params.id, {
			include: [{
				model:UserSkill,
				include: [Skill]
			}]
		});

		Response.send({success:true,data:user});
	},
	getAllUsers: async function(Request, Response) {

		let users = await User.findAll({
			where: {
				role:0,
			},
			include:[
				{
					model: UserSkill,
                    attributes: [[sequelize.fn('SUM', sequelize.col('mark')), 'marks']]
				}
			],
			group:['users.id']
		});
        Response.send(users);

	},
	getAllUsersSkills: async function(Request, Response) {
        try {

            let page = Request.query.page;
            let offset = 0;

            if(page) {
                offset = (page-1)*10;
            }


            UserSkill.findAll({
                include: [
                    {
                        model:Skill,
                        include: [SkillCategory]
                    },
                    {
                        model: User
                    }
                ],
                limit:10,
                offset:offset,
            }).then( skills => {

                Response.send(skills);
            })
        } catch (Error) {

            Response.status(400);
            Response.send({success:false, error: Error});
        }
	},

	getUserSkills: async function(Request, Response) {

		try {

			let page = Request.query.page;
			let offset = 0;

			if(page) {
				offset = (page-1)*10;
			}

			let whereUser = {};
			let where = {};
			if(Request.params.id) {
				whereUser = {
                    userId:Request.params.id
				}
			}

			if(Request.query.id !== 'null') {
				where.categoryId = Request.query.id;
			}


            Skill.findAll({
				where: where,
                include: [
                    {
                        model:UserSkill,
                        where:whereUser,
						include: [User]
                    },
                    {
                        model: SkillCategory
                    }
                ],
				limit:10,
				offset:offset,
                order:[
                    [UserSkill,'mark', "DESC"]
                ]

            }).then(async skills => {

                let total = 0;
            	if(Request.query.id === 'null') {
                     total = await UserSkill.count({
                        where:{
                            userId: Request.params.id
                        }
                    });
				} else {
            		 total = await Skill.count({
                         where:where
                     });
				}

                Response.send({skills:skills, total: total});
            })
		} catch (Error) {

			Response.status(400);
			Response.send({success:false, error: Error});
		}

	},
	getUserSkillById: async function(Request, Response) {
        try {
            Skill.findById(Request.params.id, {
                include: [
                    {
                        model:UserSkill,
                        where:{
                            userId:Request.params.user_id,
                        }
                    },
					{
						model: SkillCategory
					}
                ],
            }).then(skills => {
                Response.send(skills);
            })
        } catch (Error) {

            Response.status(400);
            Response.send({success:false, error: Error});
        }
	},
	getUserSkillsLogs: async function(Request, Response) {

		try{
            SkillLogs.findAll({
                where:{
                    userId:Request.params.id
                },
				include: [
					{
						model:UserSkill,
						include: [
							{
								model:Skill,
								include: SkillCategory
							}
						]
					},{
                		model: User
					}
				]
            }).then( skills => {
            	Response.send({success:true, data:skills})
			}).catch( Error => {
                Response.status(400);
                Response.send({success:false, error: Error})
			});
		} catch (Error) {
			Response.status(400);
			Response.send({success:false, error: Error})
		}
	},
	getUserSkillLogById: async function(Request, Response) {

        try{
            SkillLogs.findAll({
                where:{
                    userId:Request.params.user_id
                },
                include: [
                    {
                        model:UserSkill,
						where:{
                        	skillId: Request.params.id
						},
                        include: [
                            {
                                model:Skill,
                                include: SkillCategory
                            }
                        ]
                    }
                ]
            }).then( skills => {
                Response.send({success:true, data:skills})
            }).catch( Error => {
                Response.status(400);
                Response.send({success:false, error: Error})
            });
        } catch (Error) {
            Response.status(400);
            Response.send({success:false, error: Error})
        }

	},
	getCurrentUserInfo: async function(Request, Response) {
		User.findById(Request.params.id, {
			include:[
				{
					model:UserSkill,
					order:[['mark',"DESC"]],
					include: [Skill]
				}
			]
		}).then( user => {

			let total = 0;

			for(let skill of user.userSkills) {
				total = total+skill.mark;
			}
		    user.dataValues.total = total;

            Response.send({success:true,data: user})
		})
	},

	setSettings: async function(Request, Response) {

		UserSettings.findOne({
			where: {
				userId: Request.params.id
			}
		}).then(settings => {
			if(settings) {
				settings.update({
                    dev_years:Request.body.dev_years,
                    projects_completed: Request.body.projects
				}).then(settings => {
					Response.send(settings);
				})
			} else {
                UserSettings.create({
                    userId: Request.params.id,
                    dev_years:Request.body.dev_years,
                    projects_completed: Request.body.projects
                }).then(settings => {
                	Response.send(settings);
				})
			}
		}).catch(Error => {
			Response.send({error: Error.message})
		})


	},

	uploadAvatar: function(Request, Response) {

		User.findById(Request.body.userId).then(user => {
			user.avatar = Request.file.filename;
			user.save();

            var token = jwt.sign({
                name:user.name,
                id:user.id,
                email:user.email,
                role:user.role,
                avatar: user.avatar
            },process.env.JWT_KEY);

			Response.send({success:true, token: token, file: user.avatar});
		}).catch( Error => {
			Response.send({error: Error.message})
		})
	},

	getUserSettings: function(Request, Response) {
		UserSettings.findOne({
			where: {
				userId: Request.params.id
			}
		}).then(settings => {
			Response.send(settings)
		}).catch( Error => {
			Response.send({error: Error.message})
		})
	}
};


module.exports = UserController;
