const GlobalModel = require('./../Models/index');
/*
 	MODELS
*/
const User = GlobalModel.users;
const Roadmap = GlobalModel.roadmaps;
const Skill = GlobalModel.skills;
const UserRoadmap = GlobalModel.user_roadmaps;
const Checkpoint = GlobalModel.checkpoints;
const UserCheckpoints = GlobalModel.user_checkpoints;
const SkillCategory = GlobalModel.skillsCategories;
const Mentorship = GlobalModel.mentorship;

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
/**
 *  SERVICES
 * 
 */
const RoadmapService = require('./../Services/Roadmap');




const RoadmapController = {

    create: function(Request, Response) {
        const body = Request.body;
        body.creator_id = Request.auth.id;

        Joi.validate(Request.body, RoadmapSchema.create, function(Error, Data) {
            if(!Error) {

                RoadmapService.createRoadmap(Data).spread(async (roadmap,created) => {
                    if( (Request.body.type && Request.body.type == 0) || !Request.body.type)  {
                        await RoadmapService.createUserRoadmap(Data.creator_id, roadmap.id);
                        Response.send(roadmap);
                    } else if(Request.body.type && Request.body.type == 1) {
                        await RoadmapService.createMentorshipRoadmap(Data.creator_id, roadmap.id);
                        Response.send(roadmap)
                    }

                }).catch(Error => {
                    Response.send(400, Error);
                });
            } else {
                Response.send(400, Error);
            }
        })
    },

    assignToRoadmap: async function(Request, Response) {

        const body = {
            user_id: Request.auth.id,
            roadmap_id: Request.params.id
        };

        let roadmap = await Roadmap.findById(body.roadmap_id);

        Joi.validate(body, RoadmapSchema.assign, function(Error, Data) {

            if(!Error) {
                RoadmapService.createUserRoadmap(Data.user_id, Data.roadmap_id)
                .spread(async (assign,created) => {

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

                              await RoadmapService.createUserCheckpoint(Request.auth.id,checkpoint.checkpoint_id, roadmap.id,checkpoint.index_number);

                            }

                            UserTodos.findAll({
                              where: {
                                user_id: roadmap.creator_id,
                                roadmap_id: roadmap.id
                              }
                            }).then(async todos => {

                                for(let todo of todos) {
                                  await RoadmapService.createUserTodo(Request.auth.id,todo.todo_id, 0, roadmap.id)
                                }

                                Response.send({success: true});return;
                            }).catch(Error => {
                              Response.send({title:"Todos creation error", message:Error.message})
                            });

                        }).catch(Error => {
                          Response.send({title:"Checkpoints creation error", message:Error.message})
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


    searchRoadmaps: async function(Request, Response) {

      let name = ' ';
      let where = {
        hidden: 0,
        [Op.or] : {
          creator_id: Request.auth.id
        }
      };
      let offset = 0;
      if(Request.query.name) {
        name = '%'+Request.query.name+'%';
        where = {
          hidden: 0,
          [Op.or]: [
            {
              name:{
                [Op.like] : '%'+name+'%'
              }
            }, {
              description:{
                [Op.like] :'%'+name+'%'
              }
            }
          ]
        };
      }

      if(Request.query.category_id) {
        where.category_id = Request.query.category_id;
      }

      if(Request.query.offset)
      {
        offset = Number(Request.query.offset);
      }

      try {
        let roadmaps = await Roadmap.findAll({
          where: where,
          include:[
              {
                   model:User,
                   as: 'Creator'
              },
              {
                model:User
              },
              {
                model: SkillCategory
              },
              {
                model: User,
                as: 'mentor',

              },
              {
                model: Checkpoint,
                include: [Skill]
              }
          ],
          limit:10,
          offset: offset,
          order:[['name','ASC']]
        });

        let roadmapsArray = [];
        for(let roadmap of roadmaps) {

              for(let user of roadmap.users) {
                if(Request.auth.id == user.dataValues.id) {
                  roadmap.dataValues.assigned = true;
                  break;
                }
              }
            if((roadmap.mentor[0] && (roadmap.mentor[0].id == Request.auth.id)) || roadmap.dataValues.assigned == true) {
                continue;
            }

            roadmapsArray.push(roadmap);

        }
        Response.send(roadmapsArray);
     } catch(Error) {
       Response.send(400, Error.stack)
     }

    },

    getAllRoadmaps: async function(Request, Response) {
       let roadmaps = await Roadmap.findAll({
           include:[
               {
                    model:User,
                    as: 'Creator'
               },
               {
                 model:User
               },
               {
                 model: SkillCategory
               },
               {
                 model: Checkpoint,
                 include: [Skill]
               }
           ],
           limit: 2,
           order:[['name','ASC']]
       });
       for(let roadmap of roadmaps) {
         for(let user of roadmap.users) {
           if(Request.auth.id == user.dataValues.id) {
             roadmap.dataValues.assigned = true;
             break;
           }
         }
       }
       Response.send(roadmaps);
    },

    getSignleRoadmap: async function(Request, Response) {
        Roadmap.findById(Request.params.id, {
            include: [{
                model: User,
                as:'Creator'
            },{
                model:SkillCategory
            }, {
               model:User
            }, {
                model:User,
                as:'mentor'
            }]
        }).then(roadmap => {
            roadmap.dataValues.Mentor = roadmap.mentor[0];
            roadmap.dataValues.assigned = false;
            roadmap.dataValues.mentor = false;

            for(let user of roadmap.users) 
            {
                if(user.id == Request.auth.id) {
                    roadmap.dataValues.assigned = true;
                    break;
                }
            }
            for(let user of roadmap.mentor)
            {
                if(user.id == Request.auth.id) {
                    roadmap.dataValues.mentor = true;
                    break;
                }
            }
            Response.send(roadmap);
        }).catch(Error => {
            Response.send(400, Error.message);
        })
    },



    /**
     * TODOS
     */

    createTodo: async function(Request, Response) {
        const body = {
            name: Request.body.name,
            description: Request.body.description,
            checkpoint_id: Request.params.checkpoint_id,
            creator_id: Request.auth.id
        };



        const check = RoadmapService.beforeTodoCreate({
            creator_id: Request.auth.id,
            roadmap_id: Request.params.roadmap_id,
            checkpoint_id: Request.params.checkpoint_id
        });
        
        console.log(check);

        if(check == false ) {
            Response.send({success: false, error: 'You can not create this todo'});
            return;
        }

        Joi.validate(body, TodoSchema.create, async function(Error, Data) {
            if(!Error) {
                let roadmap = await Roadmap.findById(Request.params.roadmap_id,{
                    include: [
                        {
                            model:User,
                            as:'mentor',
                            through: {
                                where: {
                                    user_id: Request.auth.id
                                }
                            }
                        }
                    ]
                });

                if(roadmap.mentor.length > 0) {
                    let createTodoFromMentor = RoadmapService.createTodoFromMentor.bind(RoadmapService);
                    createTodoFromMentor(Request, Response, roadmap, Data);
                    return;
                }

                Todo.create(Data).then( todo => {
                   UserTodos.create({
                       todo_id: todo.id,
                       user_id: Request.auth.id,
                       roadmap_id: Request.params.roadmap_id
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

        const check = RoadmapService.beforeTodoAssign({
            user_id: Request.auth.id,
            roadmap_id: Request.params.roadmap_id,
            checkpoint_id: Request.params.checkpoint_id,
            id: Request.params.id
        });

        if(check === false) {
            Response.send({success:false, error: 'You can not assign this todo'});
        }

        Joi.validate({user_id: Request.auth.id, todo_id: Request.params.id}, TodoSchema.assign, function(Error, Data) {
            if( !Error ) {
                RoadmapService.createUserTodo(Data.user_id, Data.todo_id, Request.roadmap_id)
                .spread((user_todo, created) => {

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
            include:[{
                model: Todo,
                include:[{
                    model: Checkpoint,
                    include: [
                        {
                            model: Todo,
                            include: [
                                {
                                    model:UserTodos,
                                    as: 'todos_usertodos',
                                    where: {
                                        user_id:Request.auth.id
                                    }
                                }
                            ]
                        }
                    ]
                }]
            }]
        }).then(user_todo => {
            if(user_todo) {
                user_todo.update({
                    checked: Request.body.checked
                }).then(  user_todo_updated => {

                    let UserTodosArray = user_todo.todo.checkpoint.todos.map(item => {

                        if (item.todos_usertodos[0].id != user_todo_updated.id) {
                            return item.todos_usertodos[0]
                        }
                    });

                    let checkedCount = 0;

                    if(user_todo_updated.checked == 1) {
                        checkedCount = 1
                    }

                    for(let usertodo of UserTodosArray) {
                        if(usertodo && usertodo.checked == 1) {
                            checkedCount++;
                        }
                    }
                    console.log(checkedCount, UserTodosArray.length);
                    if(checkedCount ==  UserTodosArray.length ){
                       UserCheckpoints.findOne({ 
                            checkpoint_id: Request.params.checkpoint_id,
                            roadmap_id: Request.params.roadmap_id,
                            user_id: Request.auth.id
                        }).then(checkpoint => {
                            if(checkpoint.checked != 1) {
                                checkpoint.update({
                                    checked: 1
                                });
                            }

                            Response.send({success: true, checkpoint: checkpoint})
                        });
                    } else {
                        UserCheckpoints.findOne({
                            checkpoint_id: Request.params.checkpoint_id,
                            roadmap_id: Request.params.roadmap_id,
                            user_id: Request.auth.id
                        }).then(checkpoint => {
                            if(checkpoint.checked != 0) {
                                checkpoint.update({
                                    checked: 0
                                });
                            }
                            Response.send({success: true, checkpoint: checkpoint})
                        })
                    }
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
   



    updateTodo: async function(Request, Response) {
        Todo.findOne({
            where: {
                checkpoint_id: Request.params.checkpoint_id,
                id: Request.params.id,
                creator_id: Request.auth.id
            }
        }).then( todo => {
            if(todo) {
                Joi.validate(Request.body, TodoSchema.update, async (Error, Data) => {
                    if( !Error ) {
                       let todo = await todo.update(Request.body);
                       Response.send({success: true, todo: todo});
                    } else {
                        Response.send({success: false, error: Error})
                    }
                })
               
            }
        })
    },


/** 
 *  CHECKPOINTS
 * 
 * 
*/      
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
                        },User]
                    },
                    {
                        model:Skill
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

                    if(lastIndex && lastIndex.index_number > 0)
                    {
                        Data.index_number = Number(lastIndex.index_number) + 1;
                    } else {
                        Data.index_number = 1;
                    }

                    UserCheckpoints.findOrCreate({
                        where:Data
                    }).spread((user_checkpoint, created) => {

                        if(created) {
                            Todo.findAll({
                                where: {
                                    creator_id: checkpoint.creator_id,
                                    checkpoint_id: checkpoint.id
                                }
                            }).then(async todos => {

                                for(let todo of todos) {
                                    await UserTodos.findOrCreate({
                                        where: {
                                            user_id: Request.auth.id,
                                            todo_id: todo.id,
                                            roadmap_id: Request.params.id
                                        }
                                    })
                                }

                                checkpoint.dataValues.user_checkpoints = user_checkpoint;
                                Response.send({success: true,checkpoint:checkpoint});
                            })

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
    createCheckpoint: async function(Request, Response) {

        const body = Request.body;
        body.roadmap_id = Request.params.id
        body.creator_id = Request.auth.id;

        Joi.validate(body, CheckpointSchema.create, async function(Error, Data) {
            if( !Error ) {

                let roadmap = await Roadmap.findById(body.roadmap_id,{
                    include: [
                        {
                            model:User,
                            as:'mentor',
                            through: {
                                where: {
                                    user_id: Request.auth.id
                                }
                            }
                        },{
                            model: User,
                        }
                    ]
                });

                if(roadmap.mentor.length > 0) {
                    RoadmapService.createCheckpointFromMentor(Request, Response, roadmap, Data);
                    return;
                }

                Checkpoint.create(Data).then( async checkpoint => {
                    
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

                        let check = await Checkpoint.findById(checkpoint.id, {
                        include: [
                            {
                            model:Todo,
                            include:[{
                                model:UserTodos,
                                as:'todos_usertodos',
                                where: {
                                    user_id: Request.params.id
                                }
                            }]

                            }
                        ]
                        });

                        checkpoint.getSkill().then(skill => {
                            checkpoint.dataValues.skill = skill;
                            Response.send(checkpoint);
                        }).catch(Error => {
                            Response.send(400, Error.message);
                        });

                    }).catch(Error => {
                        Response.send(400, Error.message);
                    }) ;




                }).catch(Error => {
                    Response.send(400, Error.message);
                });

            } else {
                Response.send(400, Error.message);
            }
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

    forceDeleteCheckpoint: async (Request, Response) => {
        Checkpoint.findOne({
            where: {
                roadmap_id: Request.params.roadmap_id,
                id: Request.params.id
            }
        }).then(checkpoint => {
            if(checkpoint && checkpoint.creator_id == Request.auth.id) {
                checkpoint.destroy();
                Response.send({success:true})
            }
        })
    },
    discover: async function(Request, Response) {

        let roadmap = await Roadmap.findById(Request.params.id);

        Checkpoint.findAll({
            where: {
                name: {
                    [Op.like]: '%'+Request.query.name+'%'
                }
            },
            include: [
                {
                    model:Roadmap,
                    where: {
                        category_id: roadmap.category_id,
                        hidden: false
                    },
                    include: [{
                        model: SkillCategory,
                    }]
                },
                {
                    model:User,
                    as:'creator'
                },
                {
                    model:User
                },
                {
                    model: Skill
                }
            ]
        }).then(checkpoints => {

            for(let check of checkpoints) {
                if(check.users.length > 0){
                    for(let user of check.users) {
                        if(user.id === Number(Request.auth.id)) {
                            check.dataValues.assigned = true;
                            break;
                        } else{
                            check.dataValues.assigned = false;
                        }
                    }
                } else{
                    check.dataValues.assigned = false;
                }

            }
            Response.send(checkpoints);
        })
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

    },
    mergeCheckpoint: (Request, Response) => {
        Checkpoint.findById(Request.params.id,{
            include: [
                {
                    model:Skill
                }
            ]
        }).then(async (checkpoint) => {
            let todos = await Todo.findAll({
                where: {
                    creator_id: checkpoint.creator_id,
                    checkpoint_id: checkpoint.id
                },
                include:[{
                    model:UserTodos,
                    as:'todos_usertodos',
                    where: {
                        user_id: checkpoint.creator_id
                    }
                },User]
            });
            
            UserCheckpoints.findOrCreate({
                where: {
                    user_id: Request.auth.id,
                    checkpoint_id: checkpoint.id,
                    roadmap_id: Request.params.roadmap_id
                } 
            }).spread(async (checkpointMerge, create) => {

                for(let todo of todos) {

                    UserTodos.create({
                        user_id: Request.auth.id,
                        todo_id: todo.id,
                        roadmap_id: Request.params.roadmap_id,
                    });
                    
                }
                checkpoint.dataValues.todos = [];
                checkpoint.dataValues.todos = todos;
                Response.send(checkpoint);
            }).catch(Error => {
                Response.send(Error);
                return;
            })

           
        }).catch(Error => {
            Response.send(Error);
        });
        
    },

    setMentor: function(Request, Response) {
        Mentorship.create({
            roadmap_id: Request.params.id,
            user_id: Request.body.id
        }).then(mentorship => {
            Response.send({success:true})
        }).catch(Error => {
            Response.send(Error)
        })
    }
};

module.exports = RoadmapController;
