const express = require('express');

const homeController = require('../controllers/home');

const router = express.Router();

const multer = require("multer");

const upload = multer()

router.get('/home', homeController.getHome);

router.post('/home', upload.none(),homeController.fitlerAdmin);

router.get('/home/add_admin',homeController.addAdminAdd);

router.post('/home/add_admin', upload.none(),homeController.addNewAdmin);

router.get('/home/edit_admin', homeController.getAdminEdit);

router.post('/home/edit_admin',upload.none() ,homeController.updateAdminInfo);


module.exports = router;