const { query } = require('../../src/connect');

const stringHelper = require('../../src/helper/string-helper');

const { pythonRunner } = require('../../src/helper/function-helper');

const API = require('../../src/api');

const { imageURL } = require('../../src/config.json')

const sizeOf = require('image-size');

function getPostStatus(status) {
    switch (status) {
        case 0:
            return "Closed";
        case 1:
            return "Public";
        case 2:
            return "Transferred";

    }
}

exports.addNewPost = async (req, res) => {
    const submittedValues = req.body;
    const sql = "INSERT INTO post (name,content,type_id,created_by,others,status) Values (?,?,?,?,?,?)";
    const values = [submittedValues.name, submittedValues.content, submittedValues.type_id, submittedValues.created_by, submittedValues.others, 1];
    const result = await query(sql, values);
    const postID = result.insertId;
    const files = req.files;
    for (var i = 0; i < files.length; i++) {
        const imageSQL = "INSERT INTO post_image (url,post_id,status) Values (?,?,?)";
        const imageValues = [files[i].filename, postID, 1];
        await query(imageSQL, imageValues);
    }

    for (var i = 0; i < submittedValues.tags.length; i++) {
        const tagSQL = "INSERT INTO post_saving_tag (post_id,tag_id,status) Values (?,?,?)";
        const tagValues = [postID, submittedValues.tags[i], 1];
        await query(tagSQL, tagValues);
    }
    const settlementSQL = "INSERT INTO post_settlement (post_id,settlement_type_id) VALUES (?,?)";
    const settlementValues = [postID, submittedValues.settlementType];
    const settlementResult = await query(settlementSQL, settlementValues);
    const settlementID = settlementResult.insertId;
    if (submittedValues.settlementType == '1') {
        for (var i = 0; i < submittedValues.districts.length; i++) {
            const placeSQL = "INSERT INTO post_settlement_place (district_id,settlement_id,status) Values (?,?,?)";
            const placeValues = [submittedValues.districts[i], settlementID, 1];
            await query(placeSQL, placeValues);
        }
    }
    API.success(res, { 'postID': postID });
}


exports.getPostType = async (_, res) => {
    const sql = "SELECT id,name FROM post_type where status = ? ORDER BY Name ASC";
    const values = [1];
    const types = await query(sql, values);
    API.success(res, types);
}

exports.getPostTag = async (_, res) => {
    const sql = "SELECT id,name FROM post_tag where status = ? ORDER BY Name ASC";
    const values = [1];
    const types = await query(sql, values);
    API.success(res, types);
}

exports.getPostSettlementType = async (_, res) => {
    const sql = "SELECT id,name FROM post_settlement_type where status = ? ORDER BY Name Asc";
    const values = [1];
    const types = await query(sql, values);
    API.success(res, types);
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

exports.getAllPost = async (req, res) => {
    //await sleep(15000);
    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,(SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.user_id = ? and status = 1 Limit 1) AS isLiked " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id  WHERE post.status = 1 AND post.created_by != ? ORDER BY post.id DESC LIMIT ?,? ";
    const serachRange = 10;
    const currentPageNumber = (req.params.pageNumber - 1) * serachRange;
    const userID = req.params.user_id;
    const values = [userID, userID, currentPageNumber, serachRange];

    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }
        const imagesValues = [postArticle[i].id];
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestamp(postArticle[i]["create_date"]).date;
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;

    }
    const userSQL = "SELECT name FROM user where id = ?"
    const userValues = [req.params.user_id];
    const user = await query(userSQL, userValues);
    API.success(res, { 'posts': postArticle, "user": user[0] });
}

exports.getAllPouplarPost = async (req, res) => {
    //await sleep(20000);
    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,(SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.user_id = ? and status = 1 Limit 1) AS isLiked, (Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != ? AND pvr.start_from > ?) AS visitedNumber  " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id  WHERE post.status = 1 AND post.created_by != ? ORDER BY post.id DESC ";

    const userID = req.params.user_id;
    const values = [userID, userID, stringHelper.getDateBefore(30), userID];

    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }
        const imagesValues = [postArticle[i].id];
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestamp(postArticle[i]["create_date"]).date;
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;

    }
    const userSQL = "SELECT name FROM user where id = ?"
    const userValues = [req.params.user_id];
    const user = await query(userSQL, userValues);
    let sortedPopularType = postArticle.sort((a, b) => b['visitedNumber'] - a['visitedNumber'])
    sortedPopularType = sortedPopularType.slice(0, 10)
    API.success(res, { 'posts': sortedPopularType, "user": user[0] });
}

exports.getPost = async (req, res) => {
    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,(SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.user_id = ? and status = 1 Limit 1) AS isLiked " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id  WHERE post.id = ? ";

    const userID = req.params.user_id;
    const values = [userID, req.params.post_id];

    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }
        const imagesValues = [postArticle[i].id];
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestamp(postArticle[i]["create_date"]).date;
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        postArticle[i]["statusName"] = getPostStatus(postArticle[i]['status']);
        // console.log(postArticle[i]['statusName']);
        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;

    }
    API.success(res, { 'posts': postArticle, });
}

exports.saveVistRecord = async (req, res) => {
    const submittedValues = req.body;
    const sql = "INSERT INTO post_visit_record (post_id,user_id,start_from) Values (?,?,?)";
    const values = [submittedValues.post_id, submittedValues.user_id, submittedValues.start_from];
    const record = await query(sql, values);
    API.success(res, record);
}

exports.saveLikeRecord = async (req, res) => {
    const submittedValues = req.body;
    const sql = "INSERT INTO post_liked (post_id,user_id,status) Values (?,?,1)";
    const values = [submittedValues.post_id, submittedValues.user_id];
    const record = await query(sql, values);
    API.success(res, record);
}

exports.removeLikedRecord = async (req, res) => {
    const sql = "UPDATE post_liked SET status = 0 WHERE post_id = ? and user_id = ?";
    const values = [req.params.post_id, req.params.user_id];
    const record = await query(sql, values);
    console.log(record);
    API.success(res, record);
}

exports.getPosterPostedList = async (req, res) => {
    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.user_id = ? and status = 1 Limit 1) AS isLiked " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.created_by = ? and post.id != ? and post.status = 1 ORDER BY post.create_date DESC LIMIT ?,?";
    const serachRange = 25;
    const currentPageNumber = (req.params.pageNumber - 1) * serachRange;
    const values = [req.params.user_id, req.params.poster_id, req.params.post_id, currentPageNumber, serachRange];
    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }

        const imagesValues = [postArticle[i].id];
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestampInApp(postArticle[i]["create_date"]).date;

        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;
    }
    API.success(res, postArticle);
}


exports.getPostedList = async (req, res) => {
    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != ?) AS visitedNumber " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.created_by = ? ORDER by post.create_date DESC LIMIT ?,?";
    const serachRange = 25;
    const currentPageNumber = (req.params.pageNumber - 1) * serachRange;
    const values = [req.params.user_id, req.params.user_id, currentPageNumber, serachRange];
    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {
        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }
        const imagesValues = [postArticle[i].id];
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            // console.log(savedImageURL);
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestampInApp(postArticle[i]["create_date"]).date;
        postArticle[i]["statusName"] = getPostStatus(postArticle[i]['status']);

        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;
    }
    API.success(res, postArticle);
}

exports.getLikedList = async (req, res) => {
    const sql = "SELECT Distinct post.id,post.*,pt.name AS type,user.name AS posterName,pl.create_date AS lastActionTime,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,  (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_liked pl ON pl.post_id = post.id INNER JOIN post_settlement ps ON post.id = ps.post_id  WHERE post.status = 1 AND pl.user_id = ? AND pl.status = 1 ORDER BY lastActionTime DESC LIMIT ?,?";
    const serachRange = 25;
    const currentPageNumber = (req.params.pageNumber - 1) * serachRange;
    const values = [req.params.user_id, currentPageNumber, serachRange];
    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ?";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }


        const imagesValues = [postArticle[i].id];
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestamp(postArticle[i]["create_date"]).date;
        postArticle[i]["lastActionTime"] = stringHelper.getDisplayTimeInApp(postArticle[i]["lastActionTime"]);

        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;
    }
    API.success(res, postArticle);
}

exports.getHistoryList = async (req, res) => {
    const sql = "SELECT Distinct post.id, post.*,pt.name AS type,user.name AS posterName, ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,  (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(SELECT start_from FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id = ? order by id DESC LIMIT 1) AS lastActionTime " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_visit_record pvr ON pvr.post_id = post.id INNER JOIN post_settlement ps ON post.id = ps.post_id  WHERE post.status = 1 AND pvr.user_id = ? ORDER BY lastActionTime DESC LIMIT ?,?";
    const serachRange = 25;
    const currentPageNumber = (req.params.pageNumber - 1) * serachRange;
    const values = [req.params.user_id, req.params.user_id, currentPageNumber, serachRange];
    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ?";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }

        const imagesValues = [postArticle[i].id];
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestampInApp(postArticle[i]["create_date"]).date;
        postArticle[i]["lastActionTime"] = stringHelper.getDisplayTimeInApp(postArticle[i]["lastActionTime"]);

        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;
    }
    API.success(res, postArticle);
}

exports.getTransferredList = async (req, res) => {
    const sql = "SELECT DISTINCT post.id, post.*,pt.name AS type,user.name AS posterName, ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,  (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber, (SELECT create_date as transferTime FROM post_transfer_time WHERE post_transfer_time.post_id = post.id) AS transferTime " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id INNER JOIN post_transfer_time ON post_transfer_time.post_id = post.id  WHERE post.status = 2 AND post.belong_to = ?";
    const values = [req.params.user_id, req.params.user_id];
    let postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    postArticle = postArticle.sort((a, b) => b['transferTime'] - a['transferTime']);
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ?";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }

        const imagesValues = [postArticle[i].id];
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestampInApp(postArticle[i]["create_date"]).date;
        postArticle[i]["transferTime"] = stringHelper.getTimeAndDateFromTimestampInApp(postArticle[i]["transferTime"]).date;

        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;
        // const transferDate = await query("SELECT create_date as transferTime FROM post_transfer_time WHERE post_id = ?",postArticle[i]['id']);
        // postArticle[i]['transferTime'] =  stringHelper.getTimeAndDateFromTimestampInApp(transferDate[0]['transferTime']).date;

    }
    API.success(res, postArticle);
}

exports.getRecommendPostByName = async (req, res) => {
    const userID = req.params.user_id;
    const postID = req.params.post_id;
    const pythonPath = __dirname + '/../python/recommendation.py';
    const args = [req.params.post_name, userID, postID, 50];
    const recommendations = await pythonRunner(pythonPath, args);
    // console.log(recommendations)
    recommendationsResult = Object();
    const recommendRequestSQL = "INSERT INTO recommend_request (user_id) Values (?)";
    const recommendRequestValues = [userID];
    const recommendRequest = await query(recommendRequestSQL, recommendRequestValues);
    const requestID = recommendRequest.insertId;
    for (const key in recommendations) {
        for (const [rKey, value] of Object.entries(recommendations[key])) {
            let saveKey = key;
            if (saveKey == 'liked_number') {
                saveKey = 'likedNumber';
            } else if (saveKey == 'viewed_number') {
                saveKey = 'viewedNumber';
            }
            if (recommendationsResult[rKey] !== undefined) {
                if (key == 'create_date') {
                    // console.log(value);
                    createDate = stringHelper.getTimeAndDateFromUnixTimestampInApp(value).date;
                    recommendationsResult[rKey][saveKey] = createDate;
                } else if (key == 'settlementID') {
                    if (recommendationsResult[rKey]['sTypeID'] == 1) {
                        const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ?";
                        const values = [value];
                        const settlementPlaces = await query(sql, values);
                        const settlementPlacesNames = [];
                        for (const places in settlementPlaces) {
                            settlementPlacesNames.push(settlementPlaces[places]['name']);
                        }
                        recommendationsResult[rKey]['places'] = settlementPlacesNames;
                    }
                } else {
                    recommendationsResult[rKey][saveKey] = value;
                }
            } else {
                //create a object when key is id
                const sql = "SELECT Count(id) as isLiked FROM post_liked where post_id = ? AND user_id = ? AND status = 1";
                const values = [value, userID];
                let isLiked = await query(sql, values);
                isLiked = isLiked[0]['isLiked'];
                const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1";
                const imagesValues = [value];
                const images = await query(imagesSQL, imagesValues);
                const recommendSQL = "INSERT INTO recommend_post (post_id,request_id,viewed) Values (?,?,?)";
                const recommendValues = [value, requestID, 0];
                await query(recommendSQL, recommendValues);
                let imagesArray = [];
                let imagesSize = [];
                images.forEach(element => {
                    const completeImageURL = imageURL + "/post-image/" + element.url;
                    imagesArray.push(completeImageURL);
                    savedImageURL = __dirname + '/../../file/post-image/' + element.url;
                    sizeOf(savedImageURL, function (err, dimensions) {
                        let HeightAndWidth = [];
                        HeightAndWidth.push(dimensions.width);
                        HeightAndWidth.push(dimensions.height);
                        imagesSize.push(HeightAndWidth);
                    });
                });
                const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
                const tagValues = [value];
                const tags = await query(tagSQL, tagValues);
                const tagsNames = [];
                for (const tag in tags) {
                    tagsNames.push(tags[tag]['name']);
                }
                recommendationsResult[rKey] = { 'id': value, 'name': '', 'content': '', 'type_id': 0, 'created_by': 0, 'create_date': '', 'others': '', 'status': 0, 'type': '', 'posterName': '', 'likedNumber': 0, 'viewedNumber': 0, 'isLiked': isLiked, 'images': imagesArray, 'imagesSize': imagesSize, 'sTypeID': 0, 'places': [], 'tags': tagsNames };
            }
        }
    }
    // console.log(Object.values(recommendationsResult));
    sort_result = Object.values(recommendationsResult).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    API.success(res, { 'recommend_posts': sort_result, "requst_id": 1 });
}

exports.updateRecommendPostView = async (req, res) => {
    const sql = "UPDATE recommend_post SET viewed = 1 and post_id = ? WHERE request_id = ?";
    const values = [req.params.post_id, req.params.request_id];
    const types = await query(sql, values);
    API.success(res, types);
}

exports.getPostByCriteria = async (req, res) => {
    const submittedValues = req.body;
    let types = typeof (submittedValues['types']) == "string" ? submittedValues['types'].split() : submittedValues['types'];
    const districts = typeof (submittedValues['districts']) == "string" ? submittedValues['districts'].split() : submittedValues['districts'];;
    const settlements = submittedValues['settlements'];
    const time = submittedValues['time'];
    const tags = typeof (submittedValues['tags']) == "string" ? submittedValues['tags'].split() : submittedValues['tags'];
    let typesWhereSQL = "";
    let settlementWhereSQL = "";
    if (types[0] != 0) {
        typesWhereSQL = "AND post.type_id IN (";
        let sqlTypes = "";
        for (const type in types) {
            sqlTypes += types[type] + ",";
        }
        sqlTypes = sqlTypes.slice(0, -1);
        typesWhereSQL += sqlTypes + ") ";
    }
    if (settlements[0] != 0) {
        settlementWhereSQL = "AND ps.settlement_type_id IN (";
        let sqlSettlementType = "";
        for (const settlement in settlements) {
            sqlSettlementType += settlements[settlement] + ",";
        }
        sqlSettlementType = sqlSettlementType.slice(0, -1);
        settlementWhereSQL += sqlSettlementType + ") ";
    }
    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlemetnID, (SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,(SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.user_id = ? and status = 1 Limit 1) AS isLiked " +
        `FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.status = 1 AND post.created_by != ? ${typesWhereSQL} ${settlementWhereSQL} ORDER BY post.create_date DESC`;
    // const serachRange = 100;
    // const currentPageNumber = (req.params.pageNumber - 1) * serachRange;
    const userID = req.params.user_id;
    const values = [userID, userID];
    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1";
    const currentTime = Date.now();
    let clonePostArticle = [];
    for (var i = 0; i < postArticle.length; i++) {
        let withinTime = true;
        let withinPlace = districts[0] == '0';
        let withinTag = tags[0] == '0';
        let settlementPlacesNames = [];
        let tagsName = [];
        if (time != 0) {
            const postTime = postArticle[i].create_date;
            const timeDifference = Math.abs(currentTime - postTime);
            const differentDays = Math.ceil(timeDifference / (1000 * 3600 * 24));
            if (time == 1 && differentDays > 1) {
                // clonePostArticle = clonePostArticle.filter(e => e.id != postArticle[i].id);
                withinTime = false;
            } else if (time == 2 && differentDays > 7) {
                // clonePostArticle = clonePostArticle.filter(e => e.id != postArticle[i].id);
                withinTime = false;
            } else if (time == 3 && differentDays > 30) {
                // clonePostArticle = clonePostArticle.filter(e => e.id != postArticle[i].id);
                withinTime = false;
            }
        }
        if ((settlements[0] == 1 || settlements[0] == 0) && withinTime) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ?";
            const values = [postArticle[i]['settlemetnID']];
            const settlementPlaces = await query(sql, values);
            for (const places in settlementPlaces) {
                //console.log(settlementPlaces[places]['id']);
                //console.log(districts.indexOf("" + settlementPlaces[places]['id']));
                if (districts.indexOf("" + settlementPlaces[places]['id']) != -1) {
                    withinPlace = true;
                }
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            if (withinPlace) {
                postArticle[i]['places'] = settlementPlacesNames;
            }
            // if (!withinPlace) {
            //     clonePostArticle = clonePostArticle.filter(e => e.id == postArticle[i].id);
            // } else {
            //     postArticle[i]['places'] = settlementPlacesNames;
            // }
        } else {
            postArticle[i]['places'] = [];
            withinPlace = true;
        }

        if (withinPlace && withinTime) {
            const tagSQL = "SELECT pst.tag_id , pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pst.tag_id = pt.id WHERE pst.post_id = ? AND pst.tag_id IN (?) AND pst.status = 1";
            const tagValues = [postArticle[i]['id'], tags.join(',')];
            const tagsResult = await query(tagSQL, tagValues);
            for (const tag in tagsResult) {
                if (tags.indexOf("" + tagsResult[tag]['tag_id']) != -1) {
                    withinTag = true;
                }
                tagsName.push(tagsResult[tag]['name']);
            }
            if (withinTag) {
                postArticle[i]['tags'] = tagsName;
            }
        }

        if (withinTime && withinPlace && withinTag) {
            const imagesValues = [postArticle[i].id];
            const images = await query(imagesSQL, imagesValues);
            let imagesArray = [];
            let imagesSize = [];
            images.forEach(element => {
                const completeImageURL = imageURL + "/post-image/" + element.url;
                imagesArray.push(completeImageURL);
                savedImageURL = __dirname + '/../../file/post-image/' + element.url;
                sizeOf(savedImageURL, function (err, dimensions) {
                    let HeightAndWidth = [];
                    HeightAndWidth.push(dimensions.width);
                    HeightAndWidth.push(dimensions.height);
                    imagesSize.push(HeightAndWidth);
                });
            });
            postArticle[i]["images"] = imagesArray;
            postArticle[i]["imagesSize"] = imagesSize;

            postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestampInApp(postArticle[i]["create_date"]).date;

            const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ?";
            const tagValues = [postArticle[i]['id']];
            const tags = await query(tagSQL, tagValues);
            const tagsNames = [];
            for (const tag in tags) {
                tagsNames.push(tags[tag]['name']);
            }
            postArticle[i]['tags'] = tagsNames;

            clonePostArticle.push(postArticle[i]);

        }
    }
    API.success(res, clonePostArticle);
}

exports.getRecommendPostByCriteria = async (req, res) => {
    const pythonPath = __dirname + '/../python/criteria_recommnedation.py';
    const args = [req.params.user_id, req.params.type_id, req.params.st_type, req.params.places, req.params.tags, req.params.time];
    const recommendations = await pythonRunner(pythonPath, args);
    //console.log(recommendations);
    recommendationsResult = Object();
    const userID = req.params.user_id;
    const recommendRequestSQL = "INSERT INTO recommend_request (user_id) Values (?)";
    const recommendRequestValues = [userID];
    const recommendRequest = await query(recommendRequestSQL, recommendRequestValues);
    const requestID = recommendRequest.insertId;
    for (const key in recommendations) {
        for (const [rKey, value] of Object.entries(recommendations[key])) {
            let saveKey = key;
            if (saveKey == 'liked_number') {
                saveKey = 'likedNumber';
            } else if (saveKey == 'viewed_number') {
                saveKey = 'viewedNumber';
            }
            if (recommendationsResult[rKey] !== undefined) {
                if (key == 'create_date') {
                    // console.log(value);
                    createDate = stringHelper.getTimeAndDateFromUnixTimestampInApp(value).date;
                    recommendationsResult[rKey][saveKey] = createDate;
                } else if (key == 'settlementID') {
                    if (recommendationsResult[rKey]['sTypeID'] == 1) {
                        const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ?";
                        const values = [value];
                        const settlementPlaces = await query(sql, values);
                        const settlementPlacesNames = [];
                        for (const places in settlementPlaces) {
                            settlementPlacesNames.push(settlementPlaces[places]['name']);
                        }
                        recommendationsResult[rKey]['places'] = settlementPlacesNames;
                    }
                } else {
                    recommendationsResult[rKey][saveKey] = value;
                }


            } else {
                //create a object when key is id
                const sql = "SELECT Count(id) as isLiked FROM post_liked where post_id = ? and user_id = ? and status = 1 ";
                const values = [value, userID];
                let isLiked = await query(sql, values);
                isLiked = isLiked[0]['isLiked'];
                const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1";
                const imagesValues = [value];
                const images = await query(imagesSQL, imagesValues);
                const recommendSQL = "INSERT INTO recommend_post (post_id,request_id,viewed) Values (?,?,?)";
                const recommendValues = [value, requestID, 0];
                await query(recommendSQL, recommendValues);
                let imagesArray = [];
                let imagesSize = [];
                images.forEach(element => {
                    const completeImageURL = imageURL + "/post-image/" + element.url;
                    imagesArray.push(completeImageURL);
                    savedImageURL = __dirname + '/../../file/post-image/' + element.url;
                    sizeOf(savedImageURL, function (err, dimensions) {
                        let HeightAndWidth = [];
                        HeightAndWidth.push(dimensions.width);
                        HeightAndWidth.push(dimensions.height);
                        imagesSize.push(HeightAndWidth);
                    });
                });
                const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
                const tagValues = [value];
                const tags = await query(tagSQL, tagValues);
                const tagsNames = [];
                for (const tag in tags) {
                    tagsNames.push(tags[tag]['name']);
                }
                recommendationsResult[rKey] = { 'id': value, 'name': '', 'content': '', 'type_id': 0, 'created_by': 0, 'create_date': '', 'others': '', 'status': 0, 'type': '', 'posterName': '', 'likedNumber': 0, 'viewedNumber': 0, 'isLiked': isLiked, 'images': imagesArray, 'imagesSize': imagesSize, 'sTypeID': 0, 'places': [], 'tags': tagsNames };
            }
        }
    }
    sort_result = Object.values(recommendationsResult).sort((a, b) => b.rating - a.rating);
    API.success(res, { 'recommend_posts': sort_result, "requst_id": requestID });
}


exports.updatePostItem = async (req, res) => {
    const postID = req.params.post_id;
    const submittedValues = req.body;
    const name = submittedValues.name;
    const content = submittedValues.content;
    const typeID = submittedValues.type_id;
    const tags = typeof (submittedValues.tags) == "string" ? submittedValues.tags.split() : submittedValues.tags;
    const updateSQL = "UPDATE post SET name = ?, content = ?, type_id  = ? WHERE id = ?";
    await query(updateSQL, [name, content, typeID, postID]);
    const orginalSType = await query("SELECT id,settlement_type_id FROM post_settlement WHERE post_id = ?", [postID]);
    if (submittedValues.settlementType != orginalSType[0]['settlement_type_id']) {
        await query("UPDATE post_settlement SET settlement_type_id = ? WHERE post_id = ?", [submittedValues.settlementType, postID]);
        if (submittedValues.settlementType == 1) {
            await query("UPDATE post_settlement_place SET status = 0 WHERE settlement_id = ? ", [orginalSType[0]['id']]);
            for (var index in submittedValues.districts) {
                const oDistricts = await query("SELECT district_id FROM post_settlement_place WHERE settlement_id = ? AND status = 1", [orginalSType[0]['id']]);
                await query("UPDATE post_settlement_place SET status = 0 WHERE settlement_id = ? ", [orginalSType[0]['id']]);
                for (var index in submittedValues.districts) {
                    const district = submittedValues.districts[index];
                    let findDistrict = false;
                    for (var oDistrict in oDistricts) {
                        if (oDistricts[oDistrict]['id'] == district) {
                            findDistrict = true;
                            await query("UPDATE post_settlement_place SET status = 1 WHERE settlement_id = ? and district_id = ?", [orginalSType[0]['id'], district]);
                        }
                    }
                    if (!findDistrict) {
                        const exit = await query("SELECT district_id FROM post_settlement_place WHERE settlement_id = ? and district_id = ?", [orginalSType[0]['id'], district]);
                        if (exit.length == 1) {
                            await query("UPDATE post_settlement_place SET status = 1 WHERE settlement_id = ? and district_id = ?", [orginalSType[0]['id'], district]);
                        } else {
                            await query("INSERT INTO post_settlement_place (district_id,settlement_id,status) Values (?,?,?)", [district, orginalSType[0]['id'], 1]);
                        }

                    }
                }
            }
        }
    } else {
        if (submittedValues.settlementType == 1) {
            const oDistricts = await query("SELECT district_id FROM post_settlement_place WHERE settlement_id = ? AND status = 1", [orginalSType[0]['id']]);
            await query("UPDATE post_settlement_place SET status = 0 WHERE settlement_id = ? ", [orginalSType[0]['id']]);
            for (var index in submittedValues.districts) {
                const district = submittedValues.districts[index];
                let findDistrict = false;
                for (var oDistrict in oDistricts) {
                    if (oDistricts[oDistrict]['id'] == district) {
                        findDistrict = true;
                        await query("UPDATE post_settlement_place SET status = 1 WHERE settlement_id = ? and district_id = ?", [orginalSType[0]['id'], district]);
                    }
                }
                if (!findDistrict) {
                    const exit = await query("SELECT district_id FROM post_settlement_place WHERE settlement_id = ? and district_id = ?", [orginalSType[0]['id'], district]);
                    if (exit.length == 1) {
                        await query("UPDATE post_settlement_place SET status = 1 WHERE settlement_id = ? and district_id = ?", [orginalSType[0]['id'], district]);
                    } else {
                        await query("INSERT INTO post_settlement_place (district_id,settlement_id,status) Values (?,?,?)", [district, orginalSType[0]['id'], 1]);
                    }

                }
            }
        }
    }



    const files = req.files;
    for (var i = 0; i < files.length; i++) {
        const imageSQL = "INSERT INTO post_image (url,post_id,status) Values (?,?,?)";
        const imageValues = [files[i].filename, postID, 1];
        await query(imageSQL, imageValues);
    }

    const deteledFile = typeof (submittedValues.deleted_image) == "string" ? submittedValues.deleted_image.split() : submittedValues.deleted_image;
    // console.log(deteledFile);
    if (deteledFile != null) {
        for (var i = 0; i < deteledFile.length; i++) {
            console.log(deteledFile[i].replace(imageURL + "/post-image/", ""));
            const imageSQL = "Update post_image SET status = 0 WHERE url = ? and post_id = ?";
            const imageValues = [deteledFile[i].replace(imageURL + "/post-image/", ""), postID];
            await query(imageSQL, imageValues);
        }
    }


    const oTags = await query("SELECT tag_id FROM post_saving_tag WHERE post_id = ? AND status = 1", [postID]);
    await query("UPDATE post_saving_tag SET status = 0 WHERE post_id = ? ", [postID]);

    for (var index in tags) {
        const tagValue = tags[index];
        // console.log(tagValue)
        let findTag = false;
        for (var oTag in oTags) {
            if (oTags[oTag]['id'] == tagValue) {
                findTag = true;
                await query("UPDATE post_saving_tag SET status = 1 WHERE post_id = ? and tag_id = ?", [postID, tagValue]);
            }
        }
        if (!findTag) {
            const exit = await query("SELECT tag_id FROM post_saving_tag WHERE post_id = ? and tag_id = ?", [postID, tagValue]);
            if (exit.length == 1) {
                await query("UPDATE post_saving_tag SET status = 1 WHERE post_id = ? and tag_id = ?", [postID, tagValue]);
            } else {
                await query("INSERT INTO post_saving_tag (post_id,tag_id,status) Values (?,?,?)", [postID, tagValue, 1]);
            }

        }
    }



    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName, (SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pvr.id) FROM post_visit_record pvr WHERE pvr.post_id = post.id AND pvr.user_id != ?) AS visitedNumber " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.id = ?";
    const values = [req.params.user_id, postID];
    const postArticle = await query(sql, values);
    // console.log(postArticle);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {
        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }
        const imagesValues = [postArticle[i].id];
        const images = await query(imagesSQL, imagesValues);
        imagesArray = []
        images.forEach(element => {
            imagesArray.push(imageURL + "/post-image/" + element.url);
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestampInApp(postArticle[i]["create_date"]).date;
        postArticle[i]["statusName"] = getPostStatus(postArticle[i]['status']);

        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ?";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;
    }

    API.success(res, { 'postID': postID, 'post': postArticle[0] });
}

exports.updateStatus = async (req, res) => {
    const postID = req.params.post_id;
    const status = parseInt(req.params.status);
    // console.log(postID);
    const updateSQL = "UPDATE post SET status = ? WHERE id = ?";
    const result = await query(updateSQL, [status, postID]);
    const statusName = getPostStatus(status);
    // console.log(result);
    API.success(res, { 'status': status, 'statusName': statusName });
}

exports.getLikeStatistics = async (req, res) => {
    const postID = req.params.post_id;
    const type = parseInt(req.params.type);
    result = [];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    switch (type) {
        case 1:
            for (var i = 0; i < 7; i++) {
                currentDay = stringHelper.getDateBefore(6 - i);
                nextCurrentDay = stringHelper.getDateBefore(6 - i - 1);
                const values = [postID, currentDay, nextCurrentDay];
                let statistic = await query("SELECT COUNT(ID) as number  FROM post_liked WHERE post_id = ? AND create_date >= ? AND create_date < ? AND status = 1", values);
                currentDayArray = currentDay.split('-');
                result.push({ 'date': currentDayArray[2] + "-" + currentDayArray[1], 'number': statistic[0]['number'] });
            }
            break;
        case 2:
            for (var i = 0; i < 30; i++) {
                currentDay = stringHelper.getDateBefore(29 - i);
                nextCurrentDay = stringHelper.getDateBefore(29 - i - 1);
                const values = [postID, currentDay, nextCurrentDay];
                let statistic = await query("SELECT COUNT(ID) as number  FROM post_liked WHERE post_id = ? AND create_date >= ? AND create_date < ? AND status = 1", values);
                currentDayArray = currentDay.split('-');
                result.push({ 'date': currentDayArray[2] + "-" + currentDayArray[1], 'number': statistic[0]['number'] });
            }
            break;

    }
    API.success(res, result);
}

exports.getViewStatistics = async (req, res) => {
    const postID = req.params.post_id;
    const type = parseInt(req.params.type);
    result = [];
    switch (type) {
        case 1:
            for (var i = 0; i < 7; i++) {
                currentDay = stringHelper.getDateBefore(6 - i);
                nextCurrentDay = stringHelper.getDateBefore(6 - i - 1);
                const values = [postID, currentDay, nextCurrentDay];
                let statistic = await query("SELECT COUNT(ID) as number  FROM post_visit_record WHERE post_id = ? AND start_from >= ? AND start_from < ? ", values);
                currentDayArray = currentDay.split('-');
                result.push({ 'date': currentDayArray[2] + "-" + currentDayArray[1], 'number': statistic[0]['number'] });
            }
            break;
        case 2:
            for (var i = 0; i < 30; i++) {
                currentDay = stringHelper.getDateBefore(30 - i);
                nextCurrentDay = stringHelper.getDateBefore(30 - i - 1);
                const values = [postID, currentDay, nextCurrentDay];
                let statistic = await query("SELECT COUNT(ID) as number  FROM post_visit_record WHERE post_id = ? AND start_from >= ? AND start_from < ? ", values);
                currentDayArray = currentDay.split('-');
                result.push({ 'date': currentDayArray[2] + "-" + currentDayArray[1], 'number': statistic[0]['number'] });
            }

    }
    API.success(res, result);
}

exports.getPostbyTag = async (req, res) => {
    const userID = req.params.user_id;
    const tag = req.params.tag;

    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,(SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.user_id = ? and status = 1 Limit 1) AS isLiked " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.status = 1 AND post.created_by != ? ORDER BY post.id";

    const values = [userID, userID];

    const postArticle = await query(sql, values);
    let clonePostArticle = [];
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {
        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1 and pt.name = ?";
        const tagValues = [postArticle[i]['id'], tag];
        const tags = await query(tagSQL, tagValues);
        if (tags.length == 1) {
            const tagsNames = [];
            const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
            const tagValues = [postArticle[i]['id']];
            const tags = await query(tagSQL, tagValues);
            for (const tag in tags) {
                tagsNames.push(tags[tag]['name']);
            }
            postArticle[i]['tags'] = tagsNames;

            if (postArticle[i]['sTypeID'] == 1) {
                const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
                const values = [postArticle[i]['settlementID']];
                const settlementPlaces = await query(sql, values);
                const settlementPlacesNames = [];
                for (const places in settlementPlaces) {
                    settlementPlacesNames.push(settlementPlaces[places]['name']);
                }
                postArticle[i]['places'] = settlementPlacesNames;

            } else {
                postArticle[i]['places'] = [];
            }
            const imagesValues = [postArticle[i].id];
            postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestamp(postArticle[i]["create_date"]).date;
            const images = await query(imagesSQL, imagesValues);
            let imagesArray = [];
            let imagesSize = [];
            images.forEach(element => {
                const completeImageURL = imageURL + "/post-image/" + element.url;
                imagesArray.push(completeImageURL);
                savedImageURL = __dirname + '/../../file/post-image/' + element.url;
                sizeOf(savedImageURL, function (err, dimensions) {
                    let HeightAndWidth = [];
                    HeightAndWidth.push(dimensions.width);
                    HeightAndWidth.push(dimensions.height);
                    imagesSize.push(HeightAndWidth);
                });
            });
            postArticle[i]["images"] = imagesArray;
            postArticle[i]["imagesSize"] = imagesSize;
            clonePostArticle.push(postArticle[i]);
        }
    }
    API.success(res, clonePostArticle);
}

exports.getPostByType = async (req, res) => {
    const userID = req.params.user_id;
    const typeId = req.params.type_id;

    const sql = "SELECT post.*,pt.name AS type,user.name AS posterName,ps.settlement_type_id as sTypeID, ps.id as settlementID,(SELECT pst.name FROM post_settlement_type pst WHERE pst.id = sTypeID) AS settlementName,(SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.status = 1) AS likedNumber,(Select COUNT(pl.id) FROM post_liked pl WHERE pl.post_id = post.id and pl.user_id = ? and status = 1 Limit 1) AS isLiked " +
        "FROM post INNER JOIN post_type pt ON post.type_id = pt.id INNER JOIN user ON post.created_by = user.id INNER JOIN post_settlement ps ON post.id = ps.post_id WHERE post.status = 1 AND post.created_by != ? AND post.type_id = ? ORDER BY post.id";

    const values = [userID, userID, typeId];

    const postArticle = await query(sql, values);
    const imagesSQL = "SELECT url FROM post_image WHERE post_id = ? and status = 1"
    for (var i = 0; i < postArticle.length; i++) {

        if (postArticle[i]['sTypeID'] == 1) {
            const sql = "SELECT psp.district_id as id , district.district_eng as name FROM post_settlement_place psp INNER JOIN district on psp.district_id = district.id WHERE settlement_id = ? AND psp.status = 1";
            const values = [postArticle[i]['settlementID']];
            const settlementPlaces = await query(sql, values);
            const settlementPlacesNames = [];
            for (const places in settlementPlaces) {
                settlementPlacesNames.push(settlementPlaces[places]['name']);
            }
            postArticle[i]['places'] = settlementPlacesNames;

        } else {
            postArticle[i]['places'] = [];
        }
        const imagesValues = [postArticle[i].id];
        postArticle[i]["create_date"] = stringHelper.getTimeAndDateFromTimestamp(postArticle[i]["create_date"]).date;
        const images = await query(imagesSQL, imagesValues);
        let imagesArray = [];
        let imagesSize = [];
        images.forEach(element => {
            const completeImageURL = imageURL + "/post-image/" + element.url;
            imagesArray.push(completeImageURL);
            savedImageURL = __dirname + '/../../file/post-image/' + element.url;
            sizeOf(savedImageURL, function (err, dimensions) {
                let HeightAndWidth = [];
                HeightAndWidth.push(dimensions.width);
                HeightAndWidth.push(dimensions.height);
                imagesSize.push(HeightAndWidth);
            });
        });
        postArticle[i]["images"] = imagesArray;
        postArticle[i]["imagesSize"] = imagesSize;
        const tagSQL = "SELECT pt.name FROM post_saving_tag pst INNER JOIN post_tag pt ON pt.id = pst.tag_id WHERE pst.post_id = ? AND pst.status = 1";
        const tagValues = [postArticle[i]['id']];
        const tags = await query(tagSQL, tagValues);
        const tagsNames = [];
        for (const tag in tags) {
            tagsNames.push(tags[tag]['name']);
        }
        postArticle[i]['tags'] = tagsNames;

    }

    API.success(res, postArticle);
}

exports.getPopularType = async (req, res) => {
    const sql = "SELECT id,name,url FROM post_type WHERE status = 1";
    let types = await query(sql, []);

    for (var i = 0; i < types.length; i++) {
        types[i]['url'] = imageURL + "/tag-image/" + types[i]['url'];
        const postSQL = "SELECT COUNT(id) as totalNumber FROM post WHERE type_id = ? and status = 1";
        const typeNumber = await query(postSQL, types[i]['id']);
        types[i]['totalNumber'] = typeNumber[0]['totalNumber'];
    }

    types.sort((a, b) => b.totalNumber - a.totalNumber);
    // console.log(types);
    API.success(res, types);
}

exports.transferItem = async (req, res) => {
    const sql = "UPDATE post SET status = 2, belong_to = ? WHERE id = ?";
    await query(sql, [req.body.owner, req.body.post_id]);
    await query("INSERT INTO post_transfer_time (post_id) VALUES (?)", [req.body.post_id])
    API.success(res, { 'message': 'The record has been saved for this transfer.' });
}

exports.getUserLikedItem = async (req, res) => {
    const sql = "SELECT DISTINCT(user.id),user.name FROM user INNER JOIN post_liked pl ON user.id = pl.user_id INNER JOIN post on pl.post_id = post.id WHERE post.created_by = ? and pl.status = 1";
    const values = [req.params.user_id];
    const userResult = await query(sql, values);
    let results = [];
    for (var i = 0; i < userResult.length; i++) {
        const sql = "SELECT COUNT(*) as totalNumber,max(pl.post_id) as postID,max(pl.create_date) as createDate FROM post_liked pl INNER JOIN post on pl.post_id = post.id WHERE post.created_by = ? and pl.status = 1 AND pl.user_id = ?";
        const values = [req.params.user_id, userResult[i]['id']];
        let result = await query(sql, values);
        let postName = await query("SELECT name,id FROM post WHERE id = ?", [result[0]['postID']])
        results.push({ 'id': userResult[i]['id'], 'name': userResult[i]['name'], 'totalNumber': result[0]['totalNumber'], 'sorted_date': result[0]['createDate'], 'create_date': stringHelper.getTimeAndDateFromTimestamp(result[0]['createDate']).date, 'postName': postName[0]['name'], 'postID': postName[0]['id'] })
        // console.log(results);
    }
    results.sort((a, b) => b.sorted_date - a.sorted_date);
    API.success(res, results);
}

exports.getUserLikedStatistic = async (req, res) => {
    const sql = "SELECT pl.create_date as createDate, p.name as postName,p.id as postID ,pt.name as postType FROM post_liked pl INNER JOIN POST p on pl.post_id = p.id INNER JOIN post_type pt ON p.type_id = pt.id WHERE p.created_by = ? and pl.user_id = ? and pl.status = 1 ORDER BY pl.create_date DESC";
    const values = [req.params.user_id, req.params.liked_user_id];
    let results = await query(sql, values);
    for (var i = 0; i < results.length; i++) {
        results[i]['createDate'] = stringHelper.getTimeAndDateFromTimestampInApp(results[i]["createDate"]).date;
    }
    API.success(res, results);
}

exports.getUserTransferredStatistic = async (req, res) => {
    const sql = "SELECT ptt.create_date as createDate, p.name as postName,p.id as postID ,pt.name as postType, ps.settlement_type_id as sTypeID FROM post_transfer_time ptt INNER JOIN POST p on ptt.post_id = p.id INNER JOIN post_type pt ON p.type_id = pt.id INNER JOIN post_settlement ps ON p.id = ps.post_id  WHERE p.created_by = ? AND p.belong_to = ? ORDER BY ptt.create_date DESC";
    const values = [req.params.user_id, req.params.liked_user_id];
    let results = await query(sql, values);
    for (var i = 0; i < results.length; i++) {
        results[i]['createDate'] = stringHelper.getTimeAndDateFromTimestampInApp(results[i]["createDate"]).date;
    }
    API.success(res, results);
}