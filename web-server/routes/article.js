const express = require('express');

const articleController = require('../controllers/article');

const router = express.Router();
const multer = require("multer");

const uuidv4 = require('uuid');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../file/image')
    },
    filename: function (req, file, cb) {
        type = file.originalname.split(".")[1];
        saveFilename = uuidv4.v4() + '.' + type;
        cb(null, saveFilename);
    }

})

const upload = multer({
    storage: storage
});

router.get('/article', articleController.getArticle);

router.post('/article', articleController.getArticle);

router.get('/article/add_article', articleController.getAddArticle);

router.post('/article/add_article', upload.array('image'), articleController.addNewArticle);

//router.post('/article/article_upload_image', upload.array('image'), articleController.uploadImage);

module.exports = router;