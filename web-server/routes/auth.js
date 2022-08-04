const express = require('express');

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/', authController.postLogin);

// router.post('/signup', authController.postSignup);

// router.post('/logout', authController.postLogout);

module.exports = router;