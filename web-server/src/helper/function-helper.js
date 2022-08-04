const {spawn} = require("child_process");

let pythonRunner = function (path, options) {
    return new Promise((resolve, reject) => {
        args = [path , ...options];
        const ls = spawn('python', args);
        ls.stdout.on('data', function (data) {
            resolve(JSON.parse(data.toString()));
        });
    })
}

module.exports = {pythonRunner}
