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
    let guestId = null;
    let guestName = null;
    const userType = 'Host';

    if (!roomName) roomName = 'New Room';
    if (!roomPassword) roomPassword = randomPassword();
    if (!hostName) hostName = 'Host';


    roomDetails.set(roomId, {
        host: {
            id: hostId,
            name: hostName
        },
        guest: {
            id: guestId,
            name: guestName
        },
        room: {
            id: roomId,
            name: roomName,
            password: roomPassword
        },
        isFull: 0
    });

    const roomDet = roomDetails.get(roomId);

    res.render('room', { title: 'ROOM', roomDet, userType });

}


const connect_guest = (req, res) => {
    const givenPassword = req.body.roomPassword;
    const roomId = req.body.roomId;

    const roomDet = roomDetails.get(roomId);
    const roomPassword = roomDet.room.password;

    const guestId = randomId();
    let guestName = req.body.guestName;

    const userType = 'Guest';

    if (!guestName) guestName = 'Guest';

    if (givenPassword === roomPassword && roomDet.isFull === 0){
        roomDet.guest.name = guestName;
        roomDet.guest.id = guestId;
        roomDet.isFull = 1;
        res.render('room', { title: roomId, roomDet, userType});
    }

    else{
        res.render('404', { title: '404' });
    }

}



io.on('connection', socket => {
    
    socket.on('join-room', (data) => {
        socket.join(data.roomId);

        const roomDet = roomDetails.get(data.roomId);

        socket.broadcast.to(data.roomId).emit('join-room', roomDet);
    });

    socket.on('offer', (data) => {
        socket.broadcast.to(data.roomId).emit('offer', data.sdp);
    });

    socket.on('answer', (data) => {
        socket.broadcast.to(data.roomId).emit('answer', data.sdp);
    });

    socket.on('candidate', (data) => {
        socket.broadcast.to(data.roomId).emit('candidate', data.candidate);
    });
    
    socket.on('end-call', (data) => {
        roomDetails.delete(data.roomId);
        socket.broadcast.to(data.roomId).emit('end-call');
    });

    socket.on('display-stream-ended', (data) => {
        socket.broadcast.to(data.roomId).emit('display-stream-ended');
    });

    socket.on('video-on-off', (data) => {
        socket.broadcast.to(data.roomId).emit('video-on-off', data.video_bool);
    });

    socket.on('meeting-started', (data) => {
        socket.broadcast.to(data.roomId).emit('video-on-off', data.video_bool);
        socket.broadcast.to(data.roomId).emit('meeting-started');
    })

});


module.exports = {
    create_room,
    connect_guest
}