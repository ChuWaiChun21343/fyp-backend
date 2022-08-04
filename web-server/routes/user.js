const express = require('express');

const userController = require('../controllers/user');

const router = express.Router();

const multer = require("multer");

const upload = multer()


router.get('/user', userController.getUser);

router.post('/user', userController.getUser);

router.post('/user/filter', userController.getUser);

router.get('/user/edit_user', userController.getUserEdit);

router.post('/user/edit_user',upload.none() ,userController.updateUserInfo);

module.exports = router;