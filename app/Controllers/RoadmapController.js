const GlobalModel = require('./../Models/index');
/*
 	MODELS
*/
const User = GlobalModel.users;
const Roadmap = GlobalModel.roadmaps;
const Skill = GlobalModel.skills;
const UserRoadmap = GlobalModel.user_roadmaps;
const Checkpoint = GlobalModel.roadmap_checkpoints;
const UserCheckpoints = GlobalModel.user_checkpoints;
const SkillCategory = GlobalModel.skillsCategories;

const Todo = GlobalModel.todos;
const UserTodos = GlobalModel.user_todos;
const Op = GlobalModel.Sequelize.Op;
const sequelize = GlobalModel.sequelize;
/*
	VALIDATORS
*/
const RoadmapSchema = require('./../Validators/RoadmapSchema');
const CheckpointSchema = require('./../Validators/CheckpointSchema');
const TodoSchema = require('./../Validators/TodoSchema');
const Joi = require('joi');

const RoadmapController = {

    create: function(Request, Response) {
        const body = Request.body;
        body.creator_id = Request.auth.id;

        Joi.validate(Request.body, RoadmapSchema.create, function(Error, Data) {
            if(!Error) {

                Roadmap.create(Data).then(roadmap => {
                    UserRoadmap.create({
                       roadmap_id: roadmap.id,
                       user_id: Data.creator_id
                    });
                    Response.send(roadmap);
                }).catch(Error => {
                    Response.send(400, Error);
                });

            } else {
                Response.send(400, Error);
            }
        })
    },

    createCheckpoint: async function(Request, Response) {

        const body = Request.body;
        body.roadmap_id = Request.params.id
        body.creator_id = Request.auth.id;
        try{
            let roadmap = await Roadmap.findById(body.roadmap_id);

            if(roadmap.creator_id !== Request.auth.id) {
                Response.send({success: false, message: 'You are not creator of this roadmap'})
            }


        } catch(Error) {
            Response.send(400, Error);
        }



        Joi.validate(body, CheckpointSchema.create, function(Error, Data) {
            if( !Error ) {

                Checkpoint.create(Data).then(checkpoint => {


                    UserCheckpoints.findOne({
                        where: {
                            user_id: Request.auth.id,
                            roadmap_id: Request.params.id
                        },
                        order:[['index_number', 'DESC']]
                    }).then(async lastIndex => {

                        let Index = 0;

                        if(lastIndex) {
                            Index = lastIndex.index_number;
                        }

                        let user_checkpoint = await UserCheckpoints.create({

                            user_id: Request.auth.id,
                            checkpoint_id: checkpoint.id,
                            roadmap_id: Request.params.id,
                            index_number: Number(Index) + 1,
                        });

                        checkpoint.dataValues.user_checkpoints = user_checkpoint;

                        Response.send(checkpoint);

                    }).catch(Error => {
                        Response.send(400, Error);
                    }) ;




                }).catch(Error => {
                    Response.send(400, Error);
                });

            } else {
                Response.send(400, Error);
            }
        })
    },

    swapCheckpointPosition: function(Request, Response){

        Joi.validate(Request.body, CheckpointSchema.swap, async function(Error, Data) {
            if(!Error) {
                let swapableCheckpoint = await UserCheckpoints.findOne({
                    where: {
                        user_id: Request.auth.id,
                        checkpoint_id: Request.params.checkpoint_id,
                        roadmap_id: Request.params.id
                    }
                });

                let changebleCheckpoint = await UserCheckpoints.findOne({
                    where: {
                        user_id: Request.auth.id,
                        roadmap_id: Request.params.id,
                        index_number: Request.body.index
                    }
                });

                if(changebleCheckpoint) {
                    changebleCheckpoint.update({
                        index_number: swapableCheckpoint.index_number
                    }).catch( Error => {
                        Response.send(400, Error);
                        return;
                    })
                }

                swapableCheckpoint.update({
                    index_number: Data.index
                }).then(swap => {
                   Response.send({success: true, swap});
                }).catch( Error => {
                    Response.send(400, Error);
                });


            } else {
                Response.send(400, Error)
            }
        });


    },

    assignToCheckpoint: async function(Request, Response) {

        const body = {
            user_id: Request.auth.id,
            checkpoint_id: Request.params.checkpoint_id,
            roadmap_id: Request.params.id
        };

        try{

            let lastIndex = await UserCheckpoints.findOne({
                where: {
                    user_id: Request.auth.id,
                    roadmap_id: Request.params.id
                },
                order:[['index_number', 'DESC']]
            });

           let checkpoint = await Checkpoint.findById(body.checkpoint_id, {
               include: [
                   {
                       model: Roadmap
                   },
                   {
                        model:Todo,
                        include:[{
                            model:UserTodos,
                            as:'todos_usertodos',
                            where: {
                                user_id: Request.auth.id
                            }
                        },User]
                    }
               ]
           });



           let userRoadmap = await UserRoadmap.findOne({
               where: {
                   user_id: Request.auth.id,
                   roadmap_id: Request.params.id
               }
           });

            console.log( Request.params.id);

           if(!checkpoint || !userRoadmap || checkpoint.roadmap_id !== Number(Request.params.id)) {
               Response.send(400, {success: false, message: 'You can not assign this checkpoint'});return;
           }


        Joi.validate(body, CheckpointSchema.assign, async function(Error, Data) {
            if(!Error) {


                if(lastIndex.index_number > 0)
                {
                    Data.index_number = Number(lastIndex.index_number) + 1;
                } else {
                    Data.index_number = 1;
                }

                UserCheckpoints.findOrCreate({
                    where:Data
                }).spread((user_checkpoint, created) => {


                    if(created) {

                        checkpoint.dataValues.user_checkpoints = user_checkpoint;
                        Response.send({success: true,checkpoint:checkpoint});
                    } else {
                        Response.send({success: false, message: 'You are already assigned to this checkpoint'});
                    }

                }).catch(Error => {
                    Response.send(400, Error);
                })
            } else {
                Response.send(400, Error);
            }
        })

        }catch( Error ) {
            Response.send(Error.message);
            return;
        }
    },

    assignToRoadmap: function(Request, Response) {

        const body = {
            user_id: Request.auth.id,
            roadmap_id: Request.params.id
        };

        Joi.validate(body, RoadmapSchema.assign, function(Error, Data) {
            if(!Error) {
                UserRoadmap.findOrCreate({
                    where:Data
                }).spread(async (assign,created) => {
                    if(created) {
                        let roadmap = await Roadmap.findById(body.roadmap_id);

                        UserCheckpoints.findAll({
                          where: {
                            roadmap_id: body.roadmap_id,
                            user_id: roadmap.creator_id
                          }
                        }).then(async checkpoints => {
                          for(let i in checkpoints) {
                            let checkpoint = checkpoints[i];
                            await UserCheckpoints.findOrCreate({
                              where: {
                                user_id: Request.auth.id,
                                checkpoint_id: checkpoint.checkpoint_id,
                                roadmap_id: roadmap.id,
                                index_number: checkpoint.index_number
                              }
                            });
                          }
                            Response.send({success: true});
                        }).catch(Error => {
                          Response.send(Error.message)
                        })


                    } else {
                        Response.send({success: false, message: 'You are already assigned to this roadmap'});
                    }
                }).catch(Error => {
                    Response.send(400, Error.message);
                })
            } else {
                Response.send(400, Error);
            }
        })

    },

    deleteAssignRoadmap: async function(Request, Response) {

        UserRoadmap.destroy({
            where:{
                user_id: Request.auth.id,
                roadmap_id: Request.params.id
            }
        }).then(user_roadmap => {
            if(user_roadmap === 1) {
                Response.send({success: true});
            } else {
                Response.send({success: false});

            }

        }).catch(Error => {
            Response.send(400, Error)
        })

    },

    deleteAssignCheckpoint: async function(Request, Response){
        UserCheckpoints.destroy({
            where:{
                user_id: Request.auth.id,
                checkpoint_id: Request.params.id
            }
        }).then(user_checkpoint => {
            if(user_checkpoint === 1) {
                Response.send({success: true});
            } else {
                Response.send({success: false});

            }

        }).catch(Error => {
            Response.send(400, Error)
        })
    },

    getAllRoadmaps: async function(Request, Response) {
       let roadmaps = await Roadmap.findAll({
           include:[
               {
                    model:User,
                    as: 'Creator'
               },
               {
                 model: SkillCategory
               },
               {
                 model: Checkpoint,
                 include: [Skill]
               }
           ]
       });
       Response.send(roadmaps);
    },

    getSignleRoadmap: async function(Request, Response) {
        Roadmap.findById(Request.params.id, {
            include: [{
                model: User,
                as:'Creator'
            },{
                model:SkillCategory
            }]
        }).then(roadmap => {
            Response.send(roadmap);
        }).catch(Error => {
            Response.send(400, Error.message);
        })
    },

    createTodo: async function(Request, Response) {
        const body = {
            name: Request.body.name,
            description: Request.body.description,
            checkpoint_id: Request.params.checkpoint_id
        };

        try{

            let UserRoadmapExistence = await UserRoadmap.findOne({
                where: {
                    user_id: Request.auth.id,
                    roadmap_id: Request.params.roadmap_id
                }
            });

            let UserCheckpointExistance = await UserCheckpoints.findOne({
                where: {
                    user_id: Request.auth.id,
                    checkpoint_id: Request.params.checkpoint_id
                }
            });

            if(!UserRoadmapExistence || !UserCheckpointExistance) {
                Response.send(400, {success: false, message: 'You can not create todo on this checkpoint'});
            }

        }catch( Error ) {
            Response.send(400, Error);
        }

        Joi.validate(body, TodoSchema.create, function(Error, Data) {
            if(!Error) {
                Todo.create(Data).then( todo => {
                   UserTodos.create({
                       todo_id: todo.id,
                       user_id: Request.auth.id
                   }).then(user_todo => {
                        todo.dataValues.users = [];
                       todo.dataValues.users[0] = {
                            user_todos:user_todo
                       }
                       Response.send({todo: todo, user_todo: user_todo});
                   })
                })
            } else {
                Response.send(400, Error)
            }
        })

    },

    assignTodo: async function(Request, Response) {

        try{

            let UserRoadmapExistence = await UserRoadmap.findOne({
                where: {
                    user_id: Request.auth.id,
                    roadmap_id: Request.params.roadmap_id
                }
            });

            let UserCheckpointExistance = await UserCheckpoints.findOne({
                where: {
                    user_id: Request.auth.id,
                    checkpoint_id: Request.params.checkpoint_id
                }
            });

            let TodoExistance = await Todo.findById(Request.params.id);

            if(!UserRoadmapExistence || !UserCheckpointExistance || TodoExistance.checkpoint_id !== Number(Request.params.checkpoint_id)) {
                Response.send(400, {success: false, message: 'You can not assign to this todo'});
                return;
            }

        }catch( Error ) {
            Response.send(400, Error.message);
            return;
        }

        Joi.validate({user_id: Request.auth.id, todo_id: Request.params.id}, TodoSchema.assign, function(Error, Data) {
            if( !Error ) {
                UserTodos.findOrCreate({
                    where: Data
                }).spread((user_todo, created) => {

                    if(created) {
                        Response.send({success: true});
                    } else {
                        Response.send({success: false, message: 'You are already assigned to this todo'})
                    }

                }).catch(Error => {
                    Response.send({success: false, error: Error});
                })
            } else {
                Response.send({success: false, error: Error});
            }
        })

    },

    deleteAssignTodo: async function(Request, Response) {

        try{

            let UserTodoExistance = await UserTodos.findOne({
                where: {
                    user_id: Request.auth.id,
                    todo_id: Request.params.id
                }
            });

            if(!UserTodoExistance) {
                Response.send(400, {success: false, message: 'You can not delete to this todo'});
            } else {

                UserTodoExistance.destroy();
                Response.send({success: true, todo: UserTodoExistance});
            }

        }catch( Error ) {
            Response.send(400, Error.message);
        }
    },

    checkTodo: async function(Request, Response) {
        UserTodos.findOne({
            where: {
                user_id: Request.auth.id,
                todo_id: Request.params.id,
            },
        }).then(todo => {
            if(todo) {
                todo.update({
                    checked: Request.body.checked
                }).then(todo => {
                    Response.send({success: true})
                }).catch(Error => {
                    Response.send(400, {success: false, error: Error.message})
                })
            } else {
                Response.send(400, {success:false, message: 'Dont find todo'})
            }

        }).catch( Error => {
            Response.send(400, Error.message)
        })
    },

    discoverCheckpoints: async function(Request, Response) {

        try {
            let checkpoints = await Checkpoint.findAll({
                where:{
                    roadmap_id: Request.params.id,
                    name: {
                        [Op.like]: '%'+Request.query.name+'%'
                    }
                },
                include: [
                    Skill,
                    {
                        model: User
                    },
                    {
                        model: User,
                        as:'creator'
                    }
                ]
            });

            for(let check of checkpoints) {
                if(check.users.length > 0){
                    for(let user of check.users) {
                        if(user.id == Number(Request.auth.id)) {
                            check.dataValues.assigned = true;
                        } else{
                            check.dataValues.assigned = false;
                        }
                    }
                } else{
                    check.dataValues.assigned = false;
                }

            }

            Response.send(checkpoints);
        } catch(Error) {
            Response.send(400, Error.message);
        }

    },

    updatePositionOfCheckpoints: async function(Request, Response) {

        try {
            let checkpoints = [];

            for(let check of Request.body.checkpoints)
            {
                let checkpoint = await UserCheckpoints.update({
                    index_number: check.index_number
                },{
                    where: {
                        id: check.id
                    }
                });

                checkpoints.push(checkpoint);
            }

            Response.send(checkpoints);
        } catch(Error) {
            Response.send(400, Error.message);
        }

    }
};

module.exports = RoadmapController;
