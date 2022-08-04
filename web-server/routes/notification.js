const express = require('express');

const notificationController = require('../controllers/notification');

const router = express.Router();

const multer = require("multer");

const upload = multer()

router.get('/notification', notificationController.getAllNotifications);

router.get('/notification/add_notification', notificationController.addNotification);

router.post('/notification/add_notification', upload.none(), notificationController.submitNotification);

router.get('/notification/edit_notification', notificationController.getNotification);

router.post('/notification/edit_notification', upload.none(), notificationController.updateNotifiction);

module.exports = router;