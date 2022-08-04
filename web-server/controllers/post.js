const { query } = require('../src/connect');
const stringHelper = require('../src/helper/string-helper');
const { imageURL } = require('../src/config.json');
const e = require('express');
var currentUserPage = 1;
let renderFirstTime = true;
let postTypeChecks = [];
let statusTypeChecks = [true, true, true];
let sortType = '3';
let orderType = 'DESC';

exports.getAllPost = async (req, res) => {

    var changePage = req.body.changePage;
    var submittedValues = req.body.post;
    let statusTypesWhereSQL = "";
    let postTypeWhereSQL = "";
    let orderSQL = "";

    const postTypeSQL = "SELECT name,id FROM post_type WHERE status = 1";
    const types = await query(postTypeSQL, []);

    if (renderFirstTime) {
        types.forEach((_) => postTypeChecks.push(true));
        renderFirstTime = false;
    }
    if (changePage != null && submittedValues == null) {
        if (changePage.arrow == null) {
            var buttonValue = parseInt(changePage.button);
            currentUserPage = buttonValue;
        } else {
            var arrowValue = parseInt(changePage.arrow);
            currentUserPage = currentUserPage + arrowValue;
        }
        orderSQL = "ORDER BY post.create_date " + orderType;
    } else if (submittedValues != null) {
        currentUserPage = 1;
        postTypeChecks.forEach(function (e, i) {
            postTypeChecks[i] = false;
        });
        statusTypeChecks = [false, false, false];
        let statusTypes = typeof (submittedValues['statusTypes']) == "string" ? submittedValues['statusTypes'].split() : submittedValues['statusTypes'];
        let postTypes = typeof (submittedValues['postTypes']) == "string" ? submittedValues['postTypes'].split() : submittedValues['postTypes'];
        sortType = submittedValues['sortingType'];
        if (submittedValues['orderBy'] != null) {
            orderType = submittedValues['orderBy'];
        }
        if (submittedValues['statusTypes'] != null) {
            statusTypesWhereSQL = "WHERE post.status IN (";
            let sqlTypes = "";
            for (const type in statusTypes) {
                sqlTypes += statusTypes[type] + ",";
                statusTypeChecks[statusTypes[type]] = true;
            }
            sqlTypes = sqlTypes.slice(0, -1);
            statusTypesWhereSQL += sqlTypes + ") ";
        }
        if (submittedValues['postTypes'] != null) {
            if (submittedValues['statusTypes'] == null) {
                postTypeWhereSQL = "WHERE post.type_id IN (";
            } else {
                postTypeWhereSQL = "AND post.type_id IN (";
            }
            let sqlPostType = "";
            for (const type in postTypes) {
                sqlPostType += postTypes[type] + ",";
                postTypeChecks[parseInt(postTypes[type]) - 1] = true;
            }
            sqlPostType = sqlPostType.slice(0, -1);
            postTypeWhereSQL += sqlPostType + ") ";
        }
        if (submittedValues['sortingType'] != '0') {
            switch (submittedValues['sortingType']) {
                case '1':
                    orderSQL = "ORDER BY post.name " + orderType;
                    break;
                case '2':
                    orderSQL = "ORDER BY post.type_id " + orderType;
                    break;
                case '3':
                    orderSQL = "ORDER BY post.create_date " + orderType;
                    break;
                case '4':
                    orderSQL = "ORDER BY visitedNumber " + orderType;
                    break;
                case '5':
                    orderSQL = "ORDER BY likedNumber " + orderType;
                    break;
            }
        }
    } else {
        orderSQL = "ORDER BY post.create_date " + orderType;
    }
    const sql = "SELECT post.*,pt.name AS type,user.id AS posterID, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber, (Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id) AS visitedNumber " +
        `FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id  ${statusTypesWhereSQL} ${postTypeWhereSQL} ${orderSQL}  LIMIT ?,? `;
    const serachRange = 25;
    const currentPageNumber = (currentUserPage - 1) * serachRange;
    const values = [currentPageNumber, serachRange];
    const postArticles = await query(sql, values);



    const imagesSQL = "SELECT url FROM post_image"
    for (var i = 0; i < postArticles.length; i++) {
        const imagesValues = [postArticles[i].id];
        const images = await query(imagesSQL, imagesValues);
        imagesArray = []
        images.forEach(element => {
            imagesArray.push(imageURL + "/post-image/" + element.url);
        });
        postArticles[i]["images"] = imagesArray;
        const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(postArticles[i]['create_date']);
        const time = timeAndDate.time;
        const date = timeAndDate.date;
        postArticles[i]['create_date'] = date;
        postArticles[i]['create_time'] = time;
    }
    const countSQL = `SELECT count(*) as totalNumber FROM post ${statusTypesWhereSQL} ${postTypeWhereSQL}`;
    const countPost = await query(countSQL, []);
    const totalNumber = countPost[0]['totalNumber'];
    const posts = postArticles;

    const maxPage = totalNumber < currentUserPage * 25 ? totalNumber : currentUserPage * 25;
    const minPage = totalNumber == 0 ? 0 : ((currentUserPage - 1) * 25) + 1;
    res.render('post/post', {
        path: '/post',
        pageTitle: 'Posts',
        posts: posts,
        totalNumber: totalNumber,
        minPage: minPage,
        maxPage: maxPage,
        currentUserPage: currentUserPage,
        postTypeChecks: postTypeChecks,
        types: types,
        statusTypeChecks: statusTypeChecks,
        sortType: sortType,
        orderType: orderType,
        session: req.session
    });
}


exports.getPostEdit = async (req, res, next) => {
    const postID = req.query.id;
    const sql = "SELECT * FROM post WHERE id = ?";
    const values = [postID];
    post = await query(sql, values);
    console.log(post);
    res.render('post/post_edit', {
        path: '/post',
        pageTitle: 'Post Edit',
        post: post[0],
        session: req.session
    });
}

exports.updatePostInfo = async (req, res, next) => {
    const postID = req.body.post.id;
    const name = req.body.post.name;
    const status = req.body.post.status;
    if(status == null){
        const updaeSQL = 'UPDATE post SET name = ?, status = ? WHERE id = ?';
        const updateSQLValues = [name, 2, postID];
        await query(updaeSQL, updateSQLValues);
    }else{
        const updaeSQL = 'UPDATE post SET name = ?, status = ? WHERE id = ?';
        const updateSQLValues = [name, status, postID];
        await query(updaeSQL, updateSQLValues);
    }



    let statusTypesWhereSQL = "";
    let postTypeWhereSQL = "";
    let orderSQL = "";

    const sql = "SELECT post.*,pt.name AS type,user.id AS posterID, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber, (Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id) AS visitedNumber " +
        `FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id  ${statusTypesWhereSQL} ${postTypeWhereSQL} ${orderSQL}  LIMIT ?,? `;
    const serachRange = 25;
    const currentPageNumber = (currentUserPage - 1) * serachRange;
    const values = [currentPageNumber, serachRange];
    const postArticles = await query(sql, values);



    const imagesSQL = "SELECT url FROM post_image"
    for (var i = 0; i < postArticles.length; i++) {
        const imagesValues = [postArticles[i].id];
        const images = await query(imagesSQL, imagesValues);
        imagesArray = []
        images.forEach(element => {
            imagesArray.push(imageURL + "/post-image/" + element.url);
        });
        postArticles[i]["images"] = imagesArray;
        const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(postArticles[i]['create_date']);
        const time = timeAndDate.time;
        const date = timeAndDate.date;
        postArticles[i]['create_date'] = date;
        postArticles[i]['create_time'] = time;
    }
    const countSQL = `SELECT count(*) as totalNumber FROM post ${statusTypesWhereSQL} ${postTypeWhereSQL}`;
    const countPost = await query(countSQL, []);
    const totalNumber = countPost[0]['totalNumber'];
    const posts = postArticles;

    const maxPage = totalNumber < currentUserPage * 25 ? totalNumber : currentUserPage * 25;
    const minPage = totalNumber == 0 ? 0 : ((currentUserPage - 1) * 25) + 1;

    const postTypeSQL = "SELECT name,id FROM post_type WHERE status = 1";
    const types = await query(postTypeSQL, []);

    res.redirect('/post');
}