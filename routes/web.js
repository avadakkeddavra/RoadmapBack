const express = require('express');
const router = express.Router();

/*
*
*   CONTROLLERS
*
* */
const SkillsController = require('../app/Controllers/skills');
const UserController = require('./../app/Controllers/UserController');
const CategoryController = require('./../app/Controllers/CategoryController');
const GlobalController = require('./../app/Controllers/GlobalController');
const RoadmapController = require('./../app/Controllers/RoadmapController');
const multer = require('multer');
const upload = multer({
    dest:'./assets/images'
});

/*
*
*   MIDDLEWARES
*
* */
const authMiddleware = require('../app/Middleware/auth');
const UploadMiddleware = require('./../app/Middleware/uploadFile');

/*
* AUTH ROUTES
*
*
* */
router.post('/register', UserController.register);
router.post('/login', UserController.login);

/**
 *
 *  GLOBAL ROUTES
 *
 * */

router.get('/stat',GlobalController.getStats);

/*
*
*   CATEGORIES FUNCTIONS ROUTES
*
* */

router.post('/category', authMiddleware.auth, authMiddleware.admin, CategoryController.create);
router.put('/category/:id', authMiddleware.auth, authMiddleware.admin, CategoryController.update);
router.delete('/category/:id', authMiddleware.auth, authMiddleware.admin, CategoryController.delete);
router.get('/category/:id', authMiddleware.auth, CategoryController.getSingle);
router.get('/category', authMiddleware.auth, CategoryController.getAll);
router.post('/category/search',  CategoryController.search);
router.get('/category/user/:id/stat', CategoryController.getUserCategoryStat);
/*
*
*   SKILLS FUNCTIONS ROUTES
*
* */
router.put('/skills', authMiddleware.auth.bind(authMiddleware), SkillsController.addSkills); // update User skill fields
router.put('/skills/:id', authMiddleware.auth.bind(authMiddleware), authMiddleware.admin, SkillsController.update)

router.post('/skills', authMiddleware.auth, SkillsController.createNewSkill);
router.delete('/skills/:id', authMiddleware.auth, authMiddleware.admin, SkillsController.delete);
router.get('/skills/categories', authMiddleware.auth, SkillsController.getCategoriesSkills);
router.get('/skills/list', SkillsController.getSkillsList);
router.get('/skills/categories/list', SkillsController.getSkillsByCategories);
router.get('/skills/check_admin', authMiddleware.auth, UserController.isAdmin);
router.get('/skills/matched',authMiddleware.auth.bind(authMiddleware), SkillsController.matched);
router.post('/skills/logs', authMiddleware.auth.bind(authMiddleware), SkillsController.getLogs);
router.post('/skills/compare', authMiddleware.auth, SkillsController.compare);
router.post('/skills/sort', SkillsController.sort);
router.post('/skills/search', SkillsController.search);
router.get('/skills/:id', authMiddleware.auth.bind(authMiddleware),authMiddleware.admin, SkillsController.getSkills);



/*
*
*   USER FUNCTIONS ROUTES
*
* */
router.get('/users', authMiddleware.auth, UserController.getAllUsers);
router.get('/user/allskills', authMiddleware.auth, UserController.getAllUsersSkills);
router.get('/user/:id', authMiddleware.auth.bind(authMiddleware), UserController.getUser);
router.get('/user/:id/skillslist', authMiddleware.auth.bind(authMiddleware), UserController.getUserSkills);
router.get('/user/:user_id/skills/:id', authMiddleware.auth.bind(authMiddleware), UserController.getUserSkillById);
router.get('/user/:id/logs', authMiddleware.auth.bind(authMiddleware), UserController.getUserSkillsLogs);
router.get('/user/:user_id/logs/skills/:id', authMiddleware.auth.bind(authMiddleware), UserController.getUserSkillLogById);
router.get('/user/:id/stat', authMiddleware.auth, UserController.getCurrentUserInfo);
router.post('/user/settings/:id', authMiddleware.auth, UserController.setSettings);
router.get('/user/settings/:id', authMiddleware.auth, UserController.getUserSettings);
router.put('/user/edit/:id', authMiddleware.auth, UserController.updateUser);
router.post('/user/avatar', UploadMiddleware.upload.bind(UploadMiddleware) ,UserController.uploadAvatar);
router.post('/user/bg', upload.single('bg'), UserController.uploadBg);

router.get('/user/roadmaps/generate',authMiddleware.auth, UserController.generateRoadmapsFromAims.bind(UserController));
router.get('/user/:id/roadmaps', authMiddleware.auth,UserController.getUserRoadmaps);
router.get('/user/:id/roadmap/:roadmap_id/checkpoints', authMiddleware.auth,UserController.getUserRoadmapCheckpoints.bind(UserController))
router.get('/user/:id/roadmap/:roadmap_id/checkpoint/:checkpoint_id/todos', authMiddleware.auth,UserController.getUserRoadmapCheckpointTodos);
router.get('/user/roadmap-stats/:id',authMiddleware.auth, UserController.getUserRoadmapStatistics);
/**
 *
 *  ROADMAPS ROUTES
 *
 *
 * */


router.get('/roadmap',authMiddleware.auth, RoadmapController.getAllRoadmaps);
router.get('/roadmap/search',authMiddleware.auth, RoadmapController.searchRoadmaps);

router.post('/roadmap/:id/checkpoint/position',authMiddleware.auth,  RoadmapController.updatePositionOfCheckpoints);
router.get('/roadmap/:id',authMiddleware.auth, RoadmapController.getSignleRoadmap);
router.post('/roadmap',authMiddleware.auth, RoadmapController.create);
router.post('/roadmap/:id/assign',authMiddleware.auth, RoadmapController.assignToRoadmap);
router.delete('/roadmap/:id/unassign', authMiddleware.auth, RoadmapController.deleteAssignRoadmap);
router.delete('/roadmap/:roadmap_id/checkpoint/:id', authMiddleware.auth, RoadmapController.forceDeleteCheckpoint);


router.get('/roadmap/:id/checkpoint/discover',authMiddleware.auth,  RoadmapController.discover);
router.get('/roadmap/:id/checkpoint/discovertest',authMiddleware.auth,  RoadmapController.discover);

router.post('/roadmap/:id/checkpoint',authMiddleware.auth,  RoadmapController.createCheckpoint);

router.delete('/roadmap/:roadmap_id/checkpoint/:id/unassign',authMiddleware.auth,  RoadmapController.deleteAssignCheckpoint);
router.post('/roadmap/:id/checkpoint/:checkpoint_id/assign',authMiddleware.auth,  RoadmapController.assignToCheckpoint);
router.post('/roadmap/:roadmap_id/checkpoint/:id/merge',authMiddleware.auth,  RoadmapController.mergeCheckpoint);


/**
 *  TODOS ROUTERS
 *
 * */
router.post('/roadmap/:roadmap_id/checkpoint/:checkpoint_id/todo', authMiddleware.auth, RoadmapController.createTodo);
router.put('/roadmap/:roadmap_id/checkpoint/:checkpoint_id/todo/:id', authMiddleware.auth, RoadmapController.updateTodo)
router.post('/roadmap/:roadmap_id/checkpoint/:checkpoint_id/todo/:id/assign', authMiddleware.auth, RoadmapController.assignTodo);
router.delete('/todo/:id/unassign', authMiddleware.auth, RoadmapController.deleteAssignTodo);
router.put('/roadmap/:roadmap_id/checkpoint/:checkpoint_id/todo/:id/check', authMiddleware.auth, RoadmapController.checkTodo);

router.post('/roadmap/:id/setmentor', authMiddleware.auth, authMiddleware.admin, RoadmapController.setMentor);
module.exports = router;
