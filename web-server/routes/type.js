const express = require('express');

const typeController = require('../controllers/type');

const router = express.Router();


const multer = require("multer");

const uuidv4 = require('uuid');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../file/tag-image')
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

router.get('/type', typeController.getAllTypes);

router.get('/type/add_type', typeController.getAddType);

router.get('/type/edit_type', typeController.getTypeEdit);

router.post('/type/add_type', upload.array('image'), typeController.addType);

router.post('/type/edit_type', upload.array('image'), typeController.updateType);

module.exports = router;