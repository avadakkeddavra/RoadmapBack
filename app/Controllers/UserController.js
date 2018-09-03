const GlobalModel = require('./../Models/index');
/*
 	MODELS
*/
const User = GlobalModel.users;
const Skill = GlobalModel.skills;
const UserSkill = GlobalModel.userSkills;
const SkillCategory = GlobalModel.skillsCategories;
const SkillLogs = GlobalModel.user_skills_logs;
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
						role:user.role
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


					Response.send({success:true,token: token});

				})
				.catch(E => {
					Response.status(400);
					Response.send({success:false,error:E});
				});

				

			}else{
				Response.status(400);
				Response.send(Error);
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

			let where = {};

			if(Request.params.id) {
				where = {
                    userId:Request.params.id
				}
			}

            Skill.findAll({
                include: [
                    {
                        model:UserSkill,
                        where:where,
						include: [User]
                    },
                    {
                        model: SkillCategory
                    }
                ],
				limit:10,
				offset:offset,
				group:['userSkill.id'],
                order:[
                    [UserSkill,'mark', "DESC"]
                ]

            }).then(async skills => {

            	let total = await UserSkill.count({
					where:{
						userId: Request.params.id
					}
				})
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
		Response.send(Request.body);
	}
};


module.exports = UserController;
