const bcrypt = require('bcrypt');

const saltRounds = 5;

let encrypt = function (plainText) {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(plainText, salt, function (err, hash) {
                const encryptPassword = hash;
                resolve(encryptPassword);
            });
        });
    })
}


let checkPassword = function (plainText, password) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(plainText, password, function (err, result) {
            resolve(result);
        });
    });
}
module.exports = { encrypt, checkPassword }