const express = require('express');

const router = express.Router();

const placeAPIController = require('../../controllers/api/place');

router.get('/api/place/district/:lang', placeAPIController.getDistrict);



module.exports = router;
