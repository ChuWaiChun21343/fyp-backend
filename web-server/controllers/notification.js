const { query } = require('../src/connect');
const stringHelper = require('../src/helper/string-helper');
const { imageURL, firebaseConfig } = require('../src/config.json');
// const { async } = require('@firebase/util');
const { admin } = require('../src/firebase-config');
const e = require('express');

var currentUserPage = 1;

exports.getAllNotifications = async (req, res) => {
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
    const notifications = await query("SELECT * FROM admin_notification ORDER BY create_date DESC");
    for (var i = 0; i < notifications.length; i++) {
        const timeAndDate = stringHelper.getTimeAndDateFromTimestamp(notifications[i]['create_date']);
        const time = timeAndDate.time;
        const date = timeAndDate.date;
        notifications[i]['create_date'] = date;
        notifications[i]['create_time'] = time;
    }
    const countSQL = "SELECT count(*) as totalNumber FROM admin_notification";
    const countNotification = await query(countSQL, []);
    const totalNumber = countNotification[0]['totalNumber'];
    const minPage = (currentUserPage - 1) * 25;
    const maxPage = totalNumber < 25 ? totalNumber : currentUserPage * 25;
    res.render('notification/notification', {
        path: '/notification',
        pageTitle: 'Notifications',
        notifications: notifications,
        totalNumber: totalNumber,
        minPage: minPage + 1,
        maxPage: maxPage,
        currentUserPage: currentUserPage,
        session: req.cookies
    });
}

exports.addNotification = async (req, res) => {
    let new_notification = { title: '', content: '', status: 0 };
    res.render('notification/notification_add', {
        path: '/notification_add',
        pageTitle: 'Add Notificaiton',
        notification: new_notification,
        session: req.cookies
    });
}

exports.getNotification = async (req, res, next) => {
    const notificationID = req.query.id;
    const sql = "SELECT * FROM admin_notification WHERE id = ?";
    const values = [notificationID];
    const notification = await query(sql, values);
    console.log(notification);
    res.render('notification/notification_edit', {
        path: '/notification_edit',
        pageTitle: 'Edit Notificaiton',
        notification: notification[0],
        session: req.cookies
    });
}

exports.submitNotification = async (req, res) => {
    const notification = req.body.notification;
    if (notification['status'] == 1) {
        const sql = "SELECT token,user_id FROM member_token INNER JOIN user ON user.id = member_token.user_id WHERE user.push_notification = 1";
        const values = [];
        let registrationTokens = await query(sql, values);
        const notificationSQL = "INSERT INTO admin_notification (title,content,created_by,status) VALUES (?,?,?,?)";
        const notificationValues = [notification.title, notification.content, 1, notification['status']];
        const newNotification = await query(notificationSQL,notificationValues);
        var userIDSet = new Set();
        for (var i = 0; i < registrationTokens.length; i++) {
            if (!userIDSet.has(registrationTokens[i]['user_id'])) {
                const userNotificationSQL = "INSERT INTO notification_view (notification_id,user_id,view) VALUES (?,?,?)";
                const userNotificationValues = [newNotification.insertId, registrationTokens[i]['user_id'], 0];
                await query(userNotificationSQL, userNotificationValues);
                userIDSet.add(registrationTokens[i]['user_id']);
            }
        }
        const message = {
            notification: {
                // badge: '',
                title: notification.title,
                body: notification.content,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
                'type': "2"
            }
        };
        registrationTokens = Object.keys(registrationTokens).map(function (tokens) { return registrationTokens[tokens]['token']; })
        admin.messaging().sendToDevice(registrationTokens, message)
            .then(response => {
                res.redirect('../notification');
            })
            .catch(error => {
                console.log(error);
            });
    } else {
        const notificationSQL = "INSERT INTO admin_notification (title,content,created_by,status) VALUES (?,?,?,?)";
        const notificationValues = [notification.title, notification.content, 1, notification['status']];
        await query(notificationSQL, notificationValues);
        res.redirect('../notification');
    }
}


exports.updateNotifiction = async (req, res, next) => {
    const notification = req.body.notification;
    const sql = "SELECT * FROM admin_notification WHERE id = ?";
    const values = [notification['id']];
    const notificationResult = await query(sql, values);
    const notificationValues = [notification.title, notification.content, notification['status'],notification['id']];
    await query("UPDATE admin_notification SET title = ?, content = ?, status = ? WHERE id = ?", notificationValues);


    if (notificationResult[0]['status'] == 0 && notification['status'] == 1) {
        const sql = "SELECT token,user_id FROM member_token INNER JOIN user ON user.id = member_token.user_id WHERE user.push_notification = 1";
        const values = [];
        let registrationTokens = await query(sql, values);
        var userIDSet = new Set();
        for (var i = 0; i < registrationTokens.length; i++) {
            if (!userIDSet.has(registrationTokens[i]['user_id'])) {
                const userNotificationSQL = "INSERT INTO notification_view (notification_id,user_id,view) VALUES (?,?,?)";
                const userNotificationValues = [notification['id'], registrationTokens[i]['user_id'], 0];
                await query(userNotificationSQL, userNotificationValues);
                userIDSet.add(registrationTokens[i]['user_id']);
            }
        }
        const message = {
            notification: {
                // badge: '',
                title: notification.title,
                body: notification.content,
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
                'type': "2"
            }
        };
        registrationTokens = Object.keys(registrationTokens).map(function (tokens) { return registrationTokens[tokens]['token']; })
        admin.messaging().sendToDevice(registrationTokens, message)
            .then(response => {
                res.redirect('../notification');
            })
            .catch(error => {
                console.log(error);
            });
    } else {
        res.redirect('../notification');
    }


}


