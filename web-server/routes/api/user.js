const express = require('express');

const router = express.Router();

const multer = require("multer");

const upload = multer()

const userAPIController = require('../../controllers/api/user');

router.get('/api/user/get-user/:id', userAPIController.getUser);

router.get('/api/user/notification/:id/:lang', userAPIController.getNotification);

router.post('/api/user/login', upload.none(),userAPIController.login);

router.post('/api/user/register',upload.none() ,userAPIController.register);

router.post('/api/user/save-non-member-token', upload.none(),userAPIController.saveNonMemberToken);

router.post('/api/user/update-user/:id',upload.none() ,userAPIController.updateProfile);

router.put('/api/user/user-logout',upload.none() ,userAPIController.logout);

router.put('/api/user/notification/:id/:status',upload.none() ,userAPIController.updateNotification);

// router.get('/api/user/inital_home_screen/:id/:pageNumber',upload.none(),userAPIController.initalHomeScreen);


module.exports = router;
