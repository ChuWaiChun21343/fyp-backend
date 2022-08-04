const express = require('express');

const router = express.Router();

const articleAPIController = require('../../controllers/api/article');

router.get('/api/article/article', articleAPIController.getArticle);



module.exports = router;
