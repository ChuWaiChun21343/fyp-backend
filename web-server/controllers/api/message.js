const { query } = require('../../src/connect');

const stringHelper = require('../../src/helper/string-helper');

const Api = require('../../src/api');
const { admin } = require('../../src/firebase-config');

exports.getPostRoomDetail = async (req, res) => {
    const params = req.params;
    const sql = "SELECT id FROM post_chat_room WHERE creator = ? AND receiver = ? and post_id = ?";
    const values = [params.creator, params.receiver, params.post_id];
    const room = await query(sql, values);
    if (room.length == 1) {
        const messageSQL = "SELECT * FROM post_message WHERE room_id = ?";
        const messageValues = [room[0]['id']];
        const messages = await query(messageSQL, messageValues);
        for (var i = 0; i < messages.length; i++) {
            const dataAndTime = stringHelper.getTimeAndDateFromTimestampInApp(messages[i]["create_date"])
            messages[i]["create_date"] = dataAndTime.date + " " + dataAndTime.time;
        }
        Api.success(res, { 'roomID': room[0]['id'], 'messages': messages });
    } else {
        const createRoomSQL = "INSERT INTO post_chat_room (creator,receiver,post_id) VALUES (?,?,?)";
        const newRoom = await query(createRoomSQL, values);
        Api.success(res, { 'roomID': newRoom.insertId, 'messages': [] });
    }
}

exports.getPostMessageRooms = async (req, res) => {
    const params = req.params;
    const sql = "SELECT pcr.id, pcr.post_id, pm.message,pm.create_date,pm.view,user.name,user.id as userID FROM post_chat_room pcr INNER JOIN post_message pm ON pcr.ID = pm.room_id INNER JOIN user ON pcr.creator = user.id WHERE pcr.post_id = ? AND pm.id = (SELECT Max(id) from post_message WHERE pcr.id = post_message.room_id)";
    const values = [params.post_id];
    const rooms = await query(sql, values);
    Api.success(res, rooms);
}

exports.getAllMessageRooms = async (req, res) => {
    const params = req.params;
    const sql = "SELECT DISTINCT pcr.id , pcr.post_id,pcr.creator,pcr.receiver  ,pm.message,pm.create_date ,pm.view,pm.creator as lastMessageUserID,user.name,user.id as userID FROM post_chat_room pcr INNER JOIN post_message pm ON pcr.ID = pm.room_id INNER JOIN user ON pcr.creator = user.id WHERE pm.id = (SELECT Max(id) from post_message WHERE pcr.id = post_message.room_id) and (pcr.creator = ? OR pcr.receiver = ?)";
    const values = [params.user_id, params.user_id];
    const rooms = await query(sql, values);
    let today = new Date().toISOString().slice(0, 10);
    console.log(today);
    for (var i = 0; i < rooms.length; i++) {
        rooms[i]['sort_date'] = rooms[i]["create_date"];
        const dataAndTime = stringHelper.getTimeAndDateFromTimestampInApp(rooms[i]["create_date"]);
        if (today == dataAndTime.date) {
            rooms[i]["create_date"] = dataAndTime.time;
        } else {
            rooms[i]["create_date"] = dataAndTime.date;
        }
    }
    rooms.sort((a, b) => b.sort_date - a.sort_date);
    Api.success(res, rooms);
}

exports.getAllMessageByRoom = async (req, res) => {
    const messageSQL = "SELECT * FROM post_message WHERE room_id = ?";
    const messageValues = [req.params.room_id];
    const messages = await query(messageSQL, messageValues);
    for (var i = 0; i < messages.length; i++) {
        const dataAndTime = stringHelper.getTimeAndDateFromTimestampInApp(messages[i]["create_date"]);
        messages[i]["create_date"] = dataAndTime.date + " " + dataAndTime.time;
    }
    Api.success(res, { 'roomID': parseInt(req.params.room_id), 'messages': messages });
}


exports.addPostMessage = async (req, res) => {
    const submittedValues = req.body;
    const sql = "INSERT INTO post_message (room_id,creator,receiver,message,image,create_date,status,view) VALUES (?,?,?,?,?,?,?,?)";
    const values = [submittedValues.room_id, submittedValues.creator, submittedValues.receiver, submittedValues.message, "", submittedValues.create_date, 1, 0];
    const messaage = await query(sql, values);
    const notificationSQL = "SELECT nt.token,user.name,user.push_notification FROM member_token nt INNER JOIN user ON nt.user_id = user.id WHERE nt.user_id = ? ";
    const notificationValues = [submittedValues.receiver];
    let registrationTokens = await query(notificationSQL, notificationValues);
    const unreadMessageSQL = "SELECT COUNT(id) as unReadNumber FROM post_message WHERE receiver = ? and status = 1";
    const unreadValues = [submittedValues.receiver];
    const unreadMessageCount = await query(unreadMessageSQL, unreadValues);
    const receiverName = await query("SELECT name FROM user WHERE id = ?", [submittedValues.creator]);
    if (registrationTokens[0]['push_notification'] == 1) {
        const message = {
            notification: {
                title: registrationTokens[0]['name'],
                body: submittedValues.message,
                badge: "" + unreadMessageCount[0]['unReadNumber'],
            },
            data: {
                "click_action": "FLUTTER_NOTIFICATION_CLICK",
                'type': "1",
                'roomID': submittedValues.room_id,
                'receiver': submittedValues.creator,
                'creator': submittedValues.receiver,
                'postID': submittedValues.post_id,
                'receiverName': receiverName[0]['name'],
            }
        };
        registrationTokens = Object.keys(registrationTokens).map(function (tokens) { return registrationTokens[tokens]['token']; })
        admin.messaging().sendToDevice(registrationTokens, message)
            .then(_ => {
                Api.success(res, { 'message': messaage });
            })
            .catch(error => {
                console.log(error);
            });
    } else {
        Api.success(res, { 'message': messaage });
    }

}


exports.updateUserViewMessage = async (req, res) => {
    const sql = "UPDATE post_message SET view = 1 WHERE receiver = ? AND view = 0 AND room_id = ?";
    const values = [req.body.user_id, req.body.room_id];
    const messages = await query(sql, values);
    Api.success(res, messages);
}
