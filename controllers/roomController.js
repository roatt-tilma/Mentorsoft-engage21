const { io }  = require('../server');

const randomId = () => {
    
    let rs = () => {
        return Math.floor((Math.random())*0x10000)
            .toString(16);
    };
    
    return rs() + '-' + rs() + '-' + rs();

}

const randomPassword = () => {
    return Math.floor((Math.random())*0x10000)
        .toString();
}

const roomDetails = new Map();

const create_room = (req, res) => {
    const roomId = randomId();
    let roomName = req.body.roomName;
    let roomPassword = req.body.roomPassword;
    const hostId = randomId();
    let hostName = req.body.hostName;

    if (!roomName) roomName = 'New Room';
    if (!roomPassword) roomPassword = randomPassword();
    if (!hostName) hostName = 'Host';

    res.render('host', { title: 'ROOM', roomId, roomName, roomPassword, hostId, hostName});
}

const connect_guest = (req, res) => {
    const givenPassword = req.body.roomPassword;
    const roomId = req.body.roomId;

    const roomDet = roomDetails.get(roomId);
    const roomPassword = roomDet.room.password;

    const guestId = randomId();
    let guestName = req.body.guestName;

    if (!guestName) guestName = 'Guest';

    if (givenPassword === roomPassword && roomDet.isFull === 0){
        roomDet.guest.name = guestName;
        roomDet.guest.id = guestId;
        roomDet.isFull = 1;
        res.render('guest', { title: roomId, guestId, roomId})
    }

    else{
        res.render('404', { title: '404' });
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

    socket.on('offer', (hostData) => {
        socket.broadcast.to(hostData.roomId).emit('offer', hostData.sdp);
    });

    socket.on('answer', (guestData) => {
        socket.broadcast.to(guestData.roomId).emit('answer', guestData.sdp);
    });

    socket.on('candidate', (iceData) => {
        socket.broadcast.to(iceData.roomId).emit('candidate', iceData.candidate);
    });

});


module.exports = {
    create_room,
    connect_guest
}