var admin = require("firebase-admin");

const serviceKey = require("./serviceKey.json");


admin.initializeApp({
    credential: admin.credential.cert(serviceKey),
})

module.exports.admin = admin