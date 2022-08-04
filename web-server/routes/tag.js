const express = require('express');

const tagController = require('../controllers/tag');

const router = express.Router();

const multer = require("multer");

const upload = multer()




router.get('/tag', tagController.getAllTags);

router.get('/tag/add_tag', tagController.getAddTag);

router.get('/tag/edit_tag', tagController.getTagEdit);

router.post('/tag/add_tag', upload.none(), tagController.addTags);

router.post('/tag/edit_tag', upload.none(), tagController.updateTag);

module.exports = router;