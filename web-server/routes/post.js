const express = require('express');

const postController = require('../controllers/post');

const router = express.Router();

const multer = require("multer");

const upload = multer()

router.get('/post', postController.getAllPost);

router.post('/post', postController.getAllPost);

router.get('/post/post_edit', postController.getPostEdit);

router.post('/post/edit_post',upload.none() ,postController.updatePostInfo);


module.exports = router;