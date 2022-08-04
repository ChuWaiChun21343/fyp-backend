const PORT = process.env.PORT || 8081;

const { createServer } = require("http");
const url = require('url');
const { Server } = require('socket.io');
const { query } = require('./connect');

const roomID = {};

const httpServer = createServer(function (req, res) {
    const baseURL = req.protocol + '://' + req.headers.host + '/';
    const path = new URL(req.url, baseURL);
    console.log('Connection');
    switch (path.pathname) {
        case '/':
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('testing');
            res.end();
            break;
    }
});



const serverIO = new Server(httpServer);

serverIO.sockets.on('connection', function (socket) {
    console.log('connected: '  + socket.id);
    socket.on('message', (data) => {
        console.log(data);
        //sequenceNumberByClient.set(socket, 1);
        // socket.send(JSON.stringify({
        //     type: "hello from server",
        //     content: [1, "2"]
        // }));
        serverIO.emit("receive", data);
        // socket.to(data.socketID).emit('hey')
    });

    // socket.on('join', (room) => {
    //     print('joined');
    //     socket.emit('joined','joined')
    // })

});


httpServer.listen(PORT, () => {
    console.log('server started');
});