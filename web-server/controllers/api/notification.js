const { query } = require('../../src/connect');

const stringHelper = require('../../src/helper/string-helper');

const Api = require('../../src/api');

const { admin } = require('../../src/firebase-config');

exports.getAllAdminNotification = async (req, res) => {
    const sql = "SELECT Distinct(an.id), an.*,nv.view FROM admin_notification an INNER JOIN notification_view nv ON an.id = nv.notification_id WHERE status = 1 and nv.user_id = ? ORDER BY an.id DESC";
    const values = [req.params.user_id];
    const notifications = await query(sql, values);
    for (var i = 0; i < notifications.length; i++) {
        notifications[i]['create_date'] = stringHelper.getTimeAndDateFromTimestampInApp(notifications[i]['create_date']).date;
        notifications[i]['create_date'] = notifications[i]['create_date'].split("-").join(".");
    }

    Api.success(res, notifications);
}

exports.updateUserView = async (req, res) => {
    const sql = "UPDATE notification_view SET view = 1 WHERE user_id = ? AND view = 0";
    const values = [req.body.user_id];
    const notifications = await query(sql, values);
    Api.success(res, notifications);
}

exports.notifyUser = async (req, res) => {
    if (req.body.type == 0) {
        const sql = "SELECT nt.token as token, pl.user_id as id FROM post_liked pl INNER JOIN member_token nt ON nt.user_id = pl.user_id WHERE pl.post_id = ? AND pl.status = 1 and pl.user_id != ?";
        const values = [req.body.post_id, req.body.user_id];
        const user = await query(sql, values);
        for (var i = 0; i < user.length; i++) {
            const unreadMessageSQL = "SELECT COUNT(id) as unReadNumber FROM post_message WHERE receiver = ? and status = 1";
            const unreadValues = [user[i]['id']];
            const unreadMessageCount = await query(unreadMessageSQL, unreadValues);
            const userNotifcationSql = "SELECT push_notification FROM user WHERE id = ?";
            const nResult = await query(userNotifcationSql, unreadValues);
            if (nResult[0]['push_notification'] == 1) {
                const message = {
                    notification: {
                        title: 'Notification',
                        body: "Your saved item \"" + req.body.itemName + "\"has been closed by poster ❌",
                        badge: "" + unreadMessageCount[0]['unReadNumber'],
                    }
                };

                admin.messaging().sendToDevice(user[i]['token'], message)
                    .then(_ => {

                    })
                    .catch(error => {
                        console.log(error);
                    });
            }

        }
    } else {
        const sql = "SELECT nt.token as token,pl.user_id as id FROM post_liked pl INNER JOIN member_token nt ON nt.user_id = pl.user_id WHERE pl.post_id = ? AND pl.status = 1 and pl.user_id = ?";
        const values = [req.body.post_id, req.body.user_id];
        const user = await query(sql, values);
        for (var i = 0; i < user.length; i++) {
            const unreadMessageSQL = "SELECT COUNT(id) as unReadNumber FROM post_message WHERE receiver = ? and status = 1";
            const unreadValues = [req.body.user_id];
            const unreadMessageCount = await query(unreadMessageSQL, unreadValues);
            const userNotifcationSql = "SELECT push_notification FROM user WHERE id = ?";
            const nResult = await query(userNotifcationSql, unreadValues);
            if (nResult[0]['push_notification'] == 1) {
                const message = {
                    notification: {
                        title: 'Notification',
                        body: "Item \"" + req.body.itemName + "\"has been transferred to you 🎁",
                        badge: "" + unreadMessageCount[0]['unReadNumber'],
                    }
                };

                admin.messaging().sendToDevice(user[i]['token'], message)
                    .then(_ => {

                    })
                    .catch(error => {
                        console.log(error);
                    });
            }

        }
    }

}