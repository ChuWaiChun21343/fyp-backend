const { query } = require('../../src/connect');

const stringHelper = require('../../src/helper/string-helper');

const Api = require('../../src/api');



exports.getArticle = async (req, res) => {
    const sql = "SELECT * FROM article limit ?,?";
    const values = [0, 25];
    let articles = await query(sql, values);
    // res.json({result:articles});
    Api.success(res, articles);
}
