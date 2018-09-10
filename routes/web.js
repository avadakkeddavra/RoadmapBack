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
const multer = require('multer');
const upload = multer({dest:'./assets/images'});
/*
*
*   MIDDLEWARES
*
* */
const authMiddleware = require('../app/Middleware/auth');


/*
* AUTH ROUTES
*
*
* */
router.post('/register', UserController.register);
router.post('/login', UserController.login);


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

/*
*
*   SKILLS FUNCTIONS ROUTES
*
* */
router.put('/skills', authMiddleware.auth.bind(authMiddleware), SkillsController.addSkills); // update User skill fields
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
router.post('/user/avatar', upload.single('avatar'), UserController.uploadAvatar);

module.exports = router;