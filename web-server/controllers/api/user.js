const { query } = require('../../src/connect');

const { encrypt, checkPassword } = require('../../src/helper/password-helper');

const stringHelper = require('../../src/helper/string-helper');

const Api = require('../../src/api');




exports.getUser = async (req, res) => {
    const sql = "SELECT id,name,email,gender,create_date,age,(SELECT COUNT(pl.id) FROM post_liked pl WHERE pl.user_id = user.id and status = 1 ) As likedNumber, (SELECT COUNT(p.id) FROM post p WHERE p.created_by = user.id ) As postedNumber FROM user where id = ?";
    const values = [req.params.id];
    let user = await query(sql, values);
    if (user[0]['age'] === null) {
        user[0]['age'] = 'Not provide';
    } else {
        user[0]['age'] = "" + user[0]['age'];
    }
    if (user[0]['gender'] === null) {
        user[0]['gender'] = 'Not provide';
    } else {
        user[0]['gender'] = user[0]['gender'] == 'm' ? 'Male' : 'Female';
    }

    user[0]['create_date'] = stringHelper.getTimeAndDateFromTimestampInApp(user[0]['create_date']).date;

    user[0]['genders'] = ['Not provide', 'Male', 'Female'];

    if (user.length == 1) {
        Api.success(res, user[0]);
    } else {
        Api.fail(res, user, { 'failType': 1 });
    }
}

exports.login = async (req, res) => {
    const submittedValues = req.body;
    let sql = "";
    let values = [];
    switch (submittedValues.login_type) {
        case '1':
            var encryptPassword = await encrypt(submittedValues.password);
            sql = "SELECT * FROM user WHERE email = ?";
            values = [submittedValues.email, encryptPassword];
            break;
        case '2':
        case '3':
            sql = "SELECT * FROM user WHERE email = ? and login_id = ?";
            values = [submittedValues.email, submittedValues.login_id];
    }
    let user = await query(sql, values);
    if (user.length == 1) {
        if (user[0]['status'] == 0) {
            Api.fail(res, { 'error_message': 'This account is in pending' }, { 'failType': 0 });
        } else if (user[0]['status'] == 2) {
            Api.fail(res, { 'error_message': 'This account has been suspended' }, { 'failType': 2 });
        } else {
            let passwordResult = true;
            if (submittedValues.login_type == '1') {
                passwordResult = await checkPassword(submittedValues.password, user[0]['password']);
                console.log(passwordResult);
            }
            if (passwordResult) {
                const tokenSQL = "INSERT INTO member_token (token,user_id) VALUES (?,?)";
                const tolenValues = [submittedValues.token, user[0]['id']];
                const result = await query(tokenSQL, tolenValues);
                Api.success(res, { 'user': user[0] });
            } else {
                Api.fail(res, { 'error_message': 'Please confirm your enter username and pssword is correct' }, { 'failType': 1 });
            }

        }

    } else {
        Api.fail(res, { 'error_message': 'Please confirm your enter username and pssword is correct' }, { 'failType': 1 });
    }
}

exports.register = async (req, res) => {
    const submittedValues = req.body;
    const serachUserSQL = `SELECT COUNT(*) as userNumber FROM user WHERE email = ? and login_type = ?;`;
    const serachUserValues = [submittedValues.email, submittedValues.login_type];
    const userNumber = await query(serachUserSQL, serachUserValues);
    if (userNumber[0].userNumber >= 1) {
        return Api.fail(res, { 'error_message': 'User has been registered' });
    }
    switch (submittedValues.login_type) {
        case '1':
            var encryptPassword = await encrypt(submittedValues.password);
            var sql = `INSERT INTO user (name,password,email,login_type,status) VALUES (?,?,?,?,1) ;`;
            var values = [submittedValues.name, encryptPassword, submittedValues.email, submittedValues.login_type];
            break;
        case '2':
        case '3':
            var sql = `INSERT INTO user (name,email,login_id,login_type,status) VALUES (?,?,?,?,1) ;`;
            var values = [submittedValues.name, submittedValues.email, submittedValues.login_id, submittedValues.login_type];
    }
    // if (submittedValues.login_type == 1) {
    //     var sql = `INSERT INTO user (name,password,email3,login_type,status) VALUES (?,?,?,?,1) ;`;
    //     var values = [submittedValues.name, submittedValues.password, submittedValues.email, submittedValues.login_type];
    // } else if (submittedValues.login_type == 2) {
    //     var sql = `INSERT INTO user (name,email,login_id,login_type,status) VALUES (?,?,?,?,1) ;`;
    //     var values = [submittedValues.name, submittedValues.email, submittedValues.login_id, submittedValues.login_type];
    // }
    let user = await query(sql, values);
    console.log('hi');
    Api.success(res, { 'userID': user.insertId, 'message': 'You have registered the account successfully' });

}

exports.saveNonMemberToken = async (req, res) => {
    const submittedValues = req.body;
    const sql = "INSERT INTO non_member_token (token) VALUES (?) ";
    const values = [submittedValues.token];
    let result = await query(sql, values);
    Api.success(res, result);
}

exports.updateProfile = async (req, res) => {
    const submittedValues = req.body;
    const sql = "UPDATE user SET name = ?, gender = ?, age = ?, email = ? WHERE id = ? ";
    const genders = ['m', 'f'];
    let gender = null;
    let age = null;
    if (submittedValues.gender != '0') {
        gender = genders[submittedValues.gender - 1]
    }
    if (submittedValues.age != '-1') {
        age = submittedValues.age;
    }
    const values = [submittedValues.name, gender, age, submittedValues.email, req.params.id];
    await query(sql, values);
    Api.success(res, { 'message': 'you have updated Successfully' });
}

exports.logout = async (req, res) => {
    const submittedValues = req.body;
    const sql = "DELETE FROM member_token WHERE token = ?";
    const values = [submittedValues.token];
    await query(sql, values);
    Api.success(res, []);
}

exports.getNotification = async (req, res) => {
    const sql = "SELECT push_notification FROM user WHERE id = ?";
    const values = [req.params.id];
    const notification = await query(sql, values);
    let notificationValue = "";
    let notifications = [];
    switch (req.params.lang) {
        case '1':
            notifications = ['Close', 'On'];
            notificationValue = notifications[notification[0]['push_notification']];
            break;
    }
    Api.success(res, { 'notification': notificationValue, 'notifications': notifications, });
}

exports.updateNotification = async (req, res) => {
    const sql = "UPDATE user set push_notification = ? WHERE id = ?";
    const values = [req.params.status, req.params.id];
    const notification = await query(sql, values);
    Api.success(res, { 'message': 'You have successfully have the notification status' });
}



// exports.initalHomeScreen = async (req, res, next) => {
//     let result =  await postAPIController.getAllPost();
//     Api.success(res, result);
// }