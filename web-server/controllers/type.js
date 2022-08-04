const { query } = require('../src/connect');
const stringHelper = require('../src/helper/string-helper');
const { imageURL, firebaseConfig } = require('../src/config.json');
// const { async } = require('@firebase/util');
const { admin } = require('../src/firebase-config');

var currentUserPage = 1;

exports.getAllTypes = async (req, res) => {

    var changePage = req.body.changePage;
    if (changePage != null) {
        if (changePage.arrow == null) {
            var buttonValue = parseInt(changePage.button);
            currentUserPage = buttonValue;
        } else {
            var arrowValue = parseInt(changePage.arrow);
            currentUserPage = currentUserPage + arrowValue;
        }
    }
    const types = await query("SELECT * FROM post_type");
    const countSQL = "SELECT count(*) as totalNumber FROM post_type";
    const countType = await query(countSQL, []);
    const totalNumber = countType[0]['totalNumber'];
    const minPage = (currentUserPage - 1) * 25;
    const maxPage = totalNumber < 25 ? totalNumber : currentUserPage * 25;
    res.render('type/type', {
        path: '/type',
        pageTitle: 'Types',
        types: types,
        totalNumber: totalNumber,
        minPage: minPage + 1,
        maxPage: maxPage,
        currentUserPage: currentUserPage,
        session: req.session
    });
}

exports.getAddType = async (req, res) => {
    const nameError = "";
    let type = { name: '', status: 0 };
    res.render('type/type_add', {
        path: '/type_add',
        pageTitle: 'Add Type',
        type: type,
        session: req.session,
        nameError: nameError
    });

}
exports.addType = async (req, res) => {
    const nameError = "";
    const type = req.body.type;
    const files = req.files;

    const checkNameSQL = "SELECT id FROM post_type WHERE name = ?";
    const nameResult = await query(checkNameSQL, [type.name]);
    if (nameResult.length > 0) {
        type['url'] = files[0].filename;
        const nameError = "This type is exited, Please change to another name"
        await res.render('type/type_add', {
            path: '/type_add',
            pageTitle: 'Type Edit',
            type: type,
            session: req.session,
            nameError: nameError
        });
    }
    else {
        console.log(type);
        const typeSQL = "INSERT INTO post_type (name,url,status) VALUES (?,?,?)";
        const typeValues = [type.name, files[0].filename, type.status];
        await query(typeSQL, typeValues);
        res.redirect('../type');
    }

}

exports.getTypeEdit = async (req, res, next) => {
    const nameError = "";
    const postID = req.query.id;
    const sql = "SELECT * FROM post_type WHERE id = ?";
    const values = [postID];
    type = await query(sql, values);
    res.render('type/type_edit', {
        path: '/type_edit',
        pageTitle: 'Type Edit',
        type: type[0],
        session: req.session,
        nameError: nameError
    });
}

exports.updateType = async (req, res) => {
    const type = req.body.type;
    const files = req.files;
    const checkNameSQL = "SELECT id FROM post_type WHERE name = ?";
    const nameResult = await query(checkNameSQL, [type.name]);


    if (nameResult.length > 0 && nameResult[0]['id'] != type.id) {
        if (files.length == 0) {
            const sql = "SELECT * FROM post_type WHERE id = ?";
            const values = [type.id];
            const result_type = await query(sql, values);
            type['url'] = result_type[0]['url'];
        } else {
            type['url'] = files[0].filename;
        }
        const nameError = "This type is exited, Please change to another name"
        await res.render('type/type_edit', {
            path: '/type_edit',
            pageTitle: 'Type Edit',
            type: type,
            session: req.session,
            nameError: nameError
        });
    } else if (files.length != 0) {
        const typeSQL = "UPDATE post_type SET name = ?, status= ? ,url = ? WHERE id = ? ";
        const typeValues = [type.name, type.status, files[0].filename, type.id];
        await query(typeSQL, typeValues);
        res.redirect('../type');
    } else {
        const typeSQL = "UPDATE post_type SET name = ?, status= ?  WHERE id = ? ";
        const typeValues = [type.name, type.status, type.id];
        await query(typeSQL, typeValues);
        res.redirect('../type');
    }

}

