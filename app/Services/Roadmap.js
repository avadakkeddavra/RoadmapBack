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

const Todo = GlobalModel.todos;
const UserTodos = GlobalModel.user_todos;
const Op = GlobalModel.Sequelize.Op;
const sequelize = GlobalModel.sequelize;

const RoadmapService = {

    createRoadmap: (Data) => {
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

    createCheckpoint: (Data) => {
        return Checkpoint.findOrCreate({where:Data});
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
    getUserCheckpoints: async (id, roadmap_id,user_id) => {

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
                        },User]
                    },
                    {
                        model: Skill
                    }
                    ]
                }
            ]
        })
    }
}

module.exports = RoadmapService;