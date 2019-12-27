var express = require("express");
var uuidv4 = require("uuid/v4");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
server.listen(process.env.PORT || 8000, function(){
    console.log("Server listener");
});
var _rooms = [];
io.on("connection", function (socket) {

    console.log("roomid: ", socket.handshake.query.roomid);
    console.log("userid: ", socket.handshake.query.userid);
    console.log("username: ", socket.handshake.query.username);
    //socket.emit("connection", socket.handshake.query.roomid);


    //if roomid not defined, socket will send all connect
    let roomid = socket.handshake.query.roomid || 'default';
    socket.join(roomid);
    //create or update room
    setRoom(roomid);
    //user
    let user = {
        id: socket.handshake.query.userid || uuidv4(),
        name: socket.handshake.query.username || null,
        email: socket.handshake.query.useremail || null,
        avatar: socket.handshake.query.useravatar || null,
        date: new Date()
    };
    pushUser(roomid, user);
    //sync data with new connected
    socket.emit('connection', getRoom(roomid));
    sendRoom(roomid, 'join', user);
    counterConnection(roomid, 1);
    //disconnected
    socket.on('disconnect', () => {
        counterConnection(roomid, -1);
        sendRoom(roomid, 'leave', user);
    });
    //
    socket.on('send-data', data => {
        sendRoom(roomid, 'receive-data', data);
    });
    //
    socket.on('update-info', data => {
        if (data.roomid !== roomid) {
            return;
        }
        if (data.owt !== undefined) {
            updateInfo(roomid, {
                owt: data.owt
            });
        }
        updateUser(roomid, data);
        sendRoom(roomid, 'receive-user', data);
    });


});

//ROOM
function setRoom(roomid) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        //
    }
    else {
        _rooms.push({
            id: roomid,
            counter: 0,
            info: {
                id: roomid
            },
            users: [],
            data: [],
            lasttime: new Date()
        });
    }
}
function getRoom(roomid) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        return rooms[0];
    }
    return {};
}
function sendRoom(roomid, key, data) {
    this._io_namespace.to(roomid).emit(key, data);
}
//connection
function counterConnection(roomid, i) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        rooms[0].counter += i;
    }
}
//DATA
function syncData(roomid, data) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        rooms[0].data = data;
    }
}
function pushData(roomid, data) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        rooms[0].data.push(data);
    }
}
function cleanData(roomid) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        rooms[0].data.length = 0;
    }
}
function getData(roomid) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        return rooms[0].data;
    }
    return [];
}
//INFO
function updateInfo(roomid, data) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        rooms[0].info.owt = data.owt;
    }
}
//USER
function pushUser(roomid, user) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        if (rooms[0].users.filter(f => f.id === user.id).length) {
            return;
        }
        rooms[0].users.push(user);
    }
}
function updateUser(roomid, userInfo) {
    let rooms = _rooms.filter(f => f.id === roomid);
    if (rooms.length) {
        rooms[0].users.filter(f => {
            if (f.id === userInfo.id) {
                Object.assign(f, userInfo);
            }
        });
    }
}

