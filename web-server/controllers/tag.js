const { query } = require('../src/connect');
const stringHelper = require('../src/helper/string-helper');
const { imageURL, firebaseConfig } = require('../src/config.json');
// const { async } = require('@firebase/util');
const { admin } = require('../src/firebase-config');

var currentUserPage = 1;

exports.getAllTags = async (req, res) => {

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
    const tags = await query("SELECT * FROM post_tag");
    const countSQL = "SELECT count(*) as totalNumber FROM post_tag";
    const countTag = await query(countSQL, []);
    const totalNumber = countTag[0]['totalNumber'];
    const minPage = (currentUserPage - 1) * 25;
    const maxPage = totalNumber < currentUserPage * 25 ? totalNumber : currentUserPage * 25;
    res.render('tag/tag', {
        path: '/tag',
        pageTitle: 'Tags',
        tags: tags,
        totalNumber: totalNumber,
        minPage: minPage + 1,
        maxPage: maxPage,
        currentUserPage: currentUserPage,
        session: req.session
    });
}

exports.getAddTag = async (req, res) => {
    let tag = { name: '', status: 0 };
    res.render('tag/tag_add', {
        path: '/tag_add',
        pageTitle: 'Add Tag',
        tag: tag,
        session: req.session,
        nameError: ""
    });
}

exports.addTags = async (req, res) => {
    const tag = req.body.tag;
    const checkNameSQL = "SELECT id FROM post_tag WHERE name = ?";
    const nameResult = await query(checkNameSQL, [tag.name]);
    if (nameResult.length > 0) {
        const nameError = "This tag is exited, Please change to another namee"
        res.render('tag/tag_add', {
            path: '/tag_add',
            pageTitle: 'Add Tag',
            tag: tag,
            session: req.session,
            nameError: nameError
        });
    } else {
        const tagSQL = "INSERT INTO post_tag (name,status) VALUES (?,?)";
        const tagsValues = [tag.name, tag.status];
        await query(tagSQL, tagsValues);
        res.redirect('../tag');
    }
}

exports.getTagEdit = async (req, res, next) => {
    const postID = req.query.id;
    const sql = "SELECT * FROM post_tag WHERE id = ?";
    const values = [postID];
    tag = await query(sql, values);
    res.render('tag/tag_edit', {
        path: '/tag_edit',
        pageTitle: 'Tag Edit',
        tag: tag[0],
        session: req.session,
        nameError: ""
    });
}

exports.updateTag = async (req, res) => {
    const tag = req.body.tag;
    const checkNameSQL = "SELECT id FROM post_tag WHERE name = ?";
    const nameResult = await query(checkNameSQL, [tag.name]);
    if (nameResult.length > 0 && nameResult[0]['id'] != tag.id) {
        const nameError = "This tag is exited, Please change to another namee"
        await res.render('tag/tag_edit', {
            path: '/tag_edit',
            pageTitle: 'Tag Edit',
            tag: tag,
            session: req.session,
            nameError: nameError
        });
    } else {
        const typeSQL = "UPDATE post_tag SET name = ?, status= ?  WHERE id = ? ";
        const typeValues = [tag.name, tag.status, tag.id];
        await query(typeSQL, typeValues);

        res.redirect('../tag');
    }
}


