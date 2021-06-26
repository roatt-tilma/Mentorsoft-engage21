const { v4: uuidV4 } = require('uuid');
const { io }  = require('../server');

const roomDetails = new Map();

const goto_room = (req, res) => {
    const roomId = uuidV4();
    const roomName = req.body.roomName;
    const roomPassword = req.body.roomPassword;
    const hostId = uuidV4();
    const hostName = req.body.hostName;
    res.render('host', { title: 'ROOM', roomId, roomName, roomPassword, hostId, hostName});
}

const connect_guest = (req, res) => {
    const givenPassword = req.body.roomPassword;
    const roomId = req.body.roomId;
    const roomDet = roomDetails.get(roomId);
    const password = roomDet.room.password;
    const guestId = uuidV4();
    const guestName = req.body.guestName;

    if (givenPassword === password){
        roomDet.guest.name = guestName;
        roomDet.guest.id = guestId;
        roomDet.isFull = 1;
        res.render('guest', { title: roomId, guestId, roomId})
    }

}


io.on('connection', socket => {
    
    socket.on('room-created', (data) => {

        socket.join(data.roomId);

        roomDetails.set(data.roomId, {
            host: {
                id: data.hostId,
                name: data.hostName
            },
            guest: {
                id: null,
                name: null
            },
            room: {
                id: data.roomId,
                name: data.roomName,
                password: data.roomPassword
            },
            isFull: 0
        });
    })

    socket.on('guest-joined', (data) => {
        
        socket.join(data.roomId);
        
        socket.broadcast.to(data.roomId).emit('guest-joined', {
            guestId: data.guestId
        });

        
    });

    socket.on('host-calling-guest-for-sending-stream', (hostData) => {
        socket.broadcast.to(hostData.roomId).emit('host-calling-guest-for-sending-stream', {
            sdp: hostData.sdp
        });
    });

    socket.on('guest-response-for-receiving-stream-from-host', (guestData) => {
        socket.broadcast.to(guestData.roomId).emit('guest-response-for-receiving-stream-from-host', {
            sdp: guestData.sdp
        });
    });

});


module.exports = {
    goto_room,
    connect_guest
}