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

const RoadmapService = {

    createRoadmap: (Data) => {
        delete Data.type;
        return Roadmap.findOrCreate({where:Data});
    },

    createUserRoadmap:  (user_id, roadmap_id) => {
        return  UserRoadmap.findOrCreate({
            where: {
                user_id: user_id,
                roadmap_id: roadmap_id
            }
        })
    },
    createMentorshipRoadmap: (user_id, roadmap_id) => {
        return  Mentorship.findOrCreate({
            where: {
                user_id: user_id,
                roadmap_id: roadmap_id
            }
        })
    },
    createCheckpoint: (Data) => {
        return Checkpoint.findOrCreate({where:Data});
    },

    createCheckpointFromMentor: async (Request, Response, roadmap, body) => {
        let AssignedUsers = roadmap.users;

        Checkpoint.create(body).then(async checkpoint => {
            for(let user of AssignedUsers) {
                UserCheckpoints.create({
                    user_id: user.id,
                    checkpoint_id: checkpoint.id,
                    roadmap_id: roadmap.id
                })
            }
            checkpoint.dataValues.skill = await checkpoint.getSkill();
            Response.send(checkpoint);
        });
    },

    createUserCheckpoint: async (user_id, checkpoint_id, roadmap_id, index) => {
        return await UserCheckpoints.findOrCreate({
            where: {
                user_id: user_id,
                checkpoint_id: checkpoint_id,
                roadmap_id: roadmap_id,
                index_number: index
            }
        })
    },

    createTodo:  (Data) => {
        return Todo.create(Data)
    },
    createTodoFromMentor: async (Request, Response, roadmap, body) => {
        let checkpoint = await Checkpoint.findById(body.checkpoint_id, {
            include: [User]
        });

        Todo.create(body).then( async todo => {
            for(let user of checkpoint.users) {
                await UserTodos.create({
                    user_id: user.id,
                    todo_id: todo.id,
                    roadmap_id: roadmap.id
                })
            }
            todo.dataValues.creator = await todo.getCreator();
            Response.send({todo});
        })

    },
    createUserTodo: async  (user_id, todo_id, checked = 0, roadmap_id) => {
        return await UserTodos.create({
            user_id: user_id,
            todo_id: todo_id,
            checked: checked,
            roadmap_id: roadmap_id
        })
    },


    beforeTodoCreate: async (Body) => {
        try {
            let UserRoadmapExistence = await UserRoadmap.findOne({
                where: {
                    user_id: Body.creator_id,
                    roadmap_id: Body.roadmap_id
                }
            });

            let UserCheckpointExistance = await UserCheckpoints.findOne({
                where: {
                    user_id: Body.id,
                    checkpoint_id: Body.checkpoint_id
                }
            });

            if(!UserRoadmapExistence || !UserCheckpointExistance) {
                return false;
            } else {
                return true;
            }
        } catch(Error) {
            return Error;
        }
    },

    beforeTodoAssign: async (Body) => {
        try {
            let UserRoadmapExistence = await UserRoadmap.findOne({
                where: {
                    user_id: Body.user_id,
                    roadmap_id: Body.roadmap_id
                }
            });

            let UserCheckpointExistance = await UserCheckpoints.findOne({
                where: {
                    user_id: Body.user_id,
                    checkpoint_id: Body.checkpoint_id
                }
            });

            let TodoExistance = await Todo.findById(Body.id);

            if(!UserRoadmapExistence || !UserCheckpointExistance || TodoExistance.checkpoint_id !== Number(Request.params.checkpoint_id)) {
                return false;
            } else {
                return true;
            }
        } catch(Error) {
            return Error;
        }

    },
    getUserCheckpoints: async (id, roadmap_id, user_id) => {

        return await User.findById(id, {
            include: [
                {
                    model:Checkpoint,
                    through: {
                        where: {
                            roadmap_id: roadmap_id
                        }
                    },
                    include: [{
                        model:Todo,
                        include:[{
                            model:UserTodos,
                            as:'todos_usertodos',
                            where: {
                                user_id: id,
                                roadmap_id:roadmap_id
                            }
                        },{
                            model:User,
                            as: 'creator'
                        }, {
                            model: User
                        } ]
                    },
                    {
                        model: Skill
                    }
                    ]
                }
            ]
        })
    },

    getRoadmapCheckpoints: async (roadmap_id, mentor_id) => {
        return new Promise((resolve, reject) => {
          Roadmap.findById(roadmap_id, {
            include: [
              {
                model:Checkpoint,
                include: [{
                  model:Todo,
                  include:[User,{
                    model:User,
                    as: 'creator'
                  }]
                },
                  {
                    model: Skill
                  }
                ]
              }
            ]
          }).then((data) => {
              const checkpoints = data.checkpoints;
            UserCheckpoints.findAll({
              where: {
                user_id: mentor_id,
                roadmap_id: roadmap_id
              },
              include: [
                {
                  model:Checkpoint,
                  as: 'checkpoints',
                  include: [{
                    model:Todo,
                    include:[User,{
                      model:User,
                      as: 'creator'
                    }]
                  },
                    {
                      model: Skill
                    }
                  ]
                }
              ]
            }).then((mergedCheckpoints) => {
               mergedCheckpoints.map((item) => {
                checkpoints.push(item.checkpoints)
               });
               resolve(checkpoints);
            }).catch((error) => {
                reject(error);
            })
          }).catch((error) => {
              reject(error);
          })
        });
    },
    assignToMentorsRoadmap: async (roadmap, data) => {
        let that = RoadmapService;
        return new Promise(async (resolve, reject) => {

            await that.createUserRoadmap(data.user_id, data.roadmap_id);

          Checkpoint.findAll({
            where: {
              roadmap_id: data.roadmap_id,
              creator_id: roadmap.mentor[0].id
            }
          }).then(async checkpoints => {
              let checkpointIds = [];
              if(checkpoints && checkpoints.length > 0) {
                for (let i in checkpoints) {
                  let checkpoint = checkpoints[i];
                  checkpointIds.push(checkpoint.id);
                  await that.createUserCheckpoint(data.user_id, checkpoint.id, roadmap.id, checkpoint.index_number);
                }
              } else {
                  resolve({ success: true });
              }

            Todo.findAll({
              where: {
                creator_id: roadmap.mentor[0].id,
                checkpoint_id: checkpointIds
              }
            }).then(async todos => {

                if(todos && todos.length > 0) {
                  for(let todo of todos) {
                    await that.createUserTodo(data.user_id, todo.id, 0, roadmap.id)
                  }
                }

                resolve({success: true});

            }).catch(Error => {
              reject(Error);
            });

          }).catch((error) => {
              reject(error);
          })
        })
    }
}

module.exports = RoadmapService;
