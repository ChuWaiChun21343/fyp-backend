const express = require('express');

const router = express.Router();

const multer = require("multer");

const upload = multer();


const notificationController = require('../../controllers/api/notification');

router.get('/api/notification/get-admin-notification-by-user/:user_id/', notificationController.getAllAdminNotification);

router.put('/api/notification/update-user-notification-view', upload.none(), notificationController.updateUserView);

router.post('/api/notification/notifyUser', upload.none(), notificationController.notifyUser);

module.exports = router;