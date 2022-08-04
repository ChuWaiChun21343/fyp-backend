const express = require('express');

const router = express.Router();

const postAPIController = require('../../controllers/api/post');


const multer = require("multer");

const uuidv4 = require('uuid');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../../file/post-image')
    },
    filename: function (req, file, cb) {
        type = file.originalname.split(".")[1];
        saveFilename = uuidv4.v4() + '.' + type;
        cb(null, saveFilename);
    }
});


const upload = multer({
    storage: storage
});

router.post('/api/post/add-post', upload.array('image'), postAPIController.addNewPost);

router.post('/api/post/save-visit-record', upload.none(), postAPIController.saveVistRecord);

router.post('/api/post/save-liked-record', upload.none(), postAPIController.saveLikeRecord);

router.post('/api/post/get-post-by-criteria/:user_id/:pageNumber', upload.none(), postAPIController.getPostByCriteria);

router.get('/api/post-by-id/:user_id/:post_id',postAPIController.getPost);

router.get('/api/post/get-post-type/:lang', postAPIController.getPostType);

router.get('/api/post/get-post-tag/:lang', postAPIController.getPostTag);

router.get('/api/post/get-post-settlement-type/:lang', postAPIController.getPostSettlementType);

router.get('/api/post/get-all-post/:user_id/:pageNumber', postAPIController.getAllPost);

router.get('/api/post/get-popular-post/:user_id', postAPIController.getAllPouplarPost);

router.get('/api/post/get-all-posted-post/:user_id/:pageNumber', postAPIController.getPostedList);

router.get('/api/post/get-all-poster-posted-post/:post_id/:poster_id/:user_id/:pageNumber', postAPIController.getPosterPostedList);

router.get('/api/post/get-all-liked-post/:user_id/:pageNumber', postAPIController.getLikedList);

router.get('/api/post/get-all-history-post/:user_id/:pageNumber', postAPIController.getHistoryList);

router.get('/api/post/get-all-transferred-post/:user_id', postAPIController.getTransferredList);

router.put('/api/post/remove-liked-post/:user_id/:post_id', postAPIController.removeLikedRecord);

router.get('/api/post/recommend-post-by-name/:user_id/:post_id/:post_name', postAPIController.getRecommendPostByName);

router.get('/api/post/recommend-post-by-criteria/:user_id/:type_id/:st_type/:places/:tags/:time', postAPIController.getRecommendPostByCriteria);

router.put('/api/post/update-recommend-post-view/:request_id/:post_id', postAPIController.updateRecommendPostView);

router.post('/api/post/:post_id/:user_id',upload.array('image'),postAPIController.updatePostItem);

router.put('/api/post/:post_id/:status',postAPIController.updateStatus);

router.get('/api/post/get-like-post-statistic/:post_id/:type', postAPIController.getLikeStatistics);

router.get('/api/post/get-view-post-statistic/:post_id/:type', postAPIController.getViewStatistics);

router.get('/api/post/get-all-tag-post/:user_id/:tag/:pageNumber', postAPIController.getPostbyTag);

router.get('/api/post/get-all-type-post/:user_id/:type_id/:pageNumber', postAPIController.getPostByType);

router.get('/api/post/get-popular-type/:date_range', postAPIController.getPopularType);

router.post('/api/post/transfer-item',upload.none() ,postAPIController.transferItem);

router.get('/api/post/all-user-like-post/:user_id' ,postAPIController.getUserLikedItem);

router.get('/api/post/all-user-like-post-detail/:user_id/:liked_user_id' ,postAPIController.getUserLikedStatistic);

router.get('/api/post/all-user-transferred-post-detail/:user_id/:liked_user_id' ,postAPIController.getUserTransferredStatistic);

module.exports = router;
