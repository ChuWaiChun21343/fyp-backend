const { query } = require('../src/connect');

async function addNewPost() {
    for (var i = 0; i < 200; i++) {
        const randomType = Math.floor(Math.random() * 2) + 1;
        const postType = i+1;
        const sql = "INSERT INTO post_settlement (post_id,settlement_type_id) Values (?,?)";
        const values = [postType,randomType];
        await query(sql,values);
    }
}

addNewPost();