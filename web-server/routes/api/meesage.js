const express = require('express');

const router = express.Router();

const multer = require("multer");

const upload = multer();

const messageAPIController = require('../../controllers/api/message');

router.get('/api/message/get-post-chat-room-detail/:creator/:receiver/:post_id', messageAPIController.getPostRoomDetail);

router.get('/api/message/get-post-chat-room-detail/:room_id/', messageAPIController.getAllMessageByRoom);

router.get('/api/message/get-message-room-by-post/:post_id/', messageAPIController.getPostMessageRooms);

router.get('/api/message/get-message-room-by-user/:user_id/', messageAPIController.getAllMessageRooms);

router.post('/api/message/add-post-message', upload.none(), messageAPIController.addPostMessage);

router.put('/api/message/update-user-view-message', upload.none(), messageAPIController.updateUserViewMessage);



module.exports = router;
