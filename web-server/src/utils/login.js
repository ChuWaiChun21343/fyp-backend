const session = require('express-session');
const { query } = require('../connect');


const { checkPassword } = require('../../src/helper/password-helper');

const login = async (username, password, callback) => {
    // connection.query('SELECT * FROM admin where username = ? and password = ?', [username, password], function (err, result, fields) {
    //     if (err) throw err;
    //     let status = -1;
    //     if(result.length == 1)
    //         status = result[0].status;
    //     callback({
    //         result: status,
    //     });
    // });
    let sql = `SELECT * FROM admin where username = ? ;`;
    let values = [username];
    const result = await query(sql, values);
    let status = -1;
    let userID = 0;
    let type = -1;
    if (result.length == 1) {
        let passwordResult = true;
        passwordResult = await checkPassword(password, result[0]['password']);
        if(passwordResult){
            status = result[0].status;
            userID = result[0].id;
            type = result[0].type;
        }
    }
    callback({
        result: status,
        userID: userID,
        type: type
    });
}

module.exports = login