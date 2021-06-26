const { values } = require('lodash');
const webrtc = require('wrtc');
const { io }  = require('../server');
const methods = require('./functions');

//connection made to upstream data to the server
const broadcast = async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org'
            },
            {
                urls: "turn:13.250.13.83:3478?transport=udp",
                username: "YzYNCouZM1mhqhmseWk6",
                credential: "YzYNCouZM1mhqhmseWk6"
            }
        ]
    });
    
    //create user object for this user
    methods.setupUser(body.roomId, body.myUserId);

    peer.ontrack = e => methods.handleTrackEvent(e, body.myUserId);

    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
}


//connection made to view broadcast from new user
const view_broadcast_new = async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org'
            },
            {
                urls: "turn:13.250.13.83:3478?transport=udp",
                username: "YzYNCouZM1mhqhmseWk6",
                credential: "YzYNCouZM1mhqhmseWk6"
            }
        ]
    });
    
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);

    await new Promise(r => setTimeout(r, 1000));
    
    methods.broadcastStreamNew(body.myUserId, body.userIdToReceiveFrom, peer);

    const answer = await peer.createAnswer();
    
    await peer.setLocalDescription(answer);

    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);

    // await new Promise(r => setTimeout(r, 1000));

    // methods.broadcastStreamNew(body.myUserId, body.userIdToReceiveFrom, peer);

}


//to give the current number of members in a room
const get_number_of_already_existing_broadcasts = ({ body }, res) => {
    
    const roomId = body.roomId;

    const payload = {
        number_of_already_existing_broadcasts: methods.getCount(roomId)
    }

    res.json(payload);

}

const view_broadcast_previous = async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org'
            },
            {
                urls: "turn:13.250.13.83:3478?transport=udp",
                username: "YzYNCouZM1mhqhmseWk6",
                credential: "YzYNCouZM1mhqhmseWk6"
            }
        ]
    });
    
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);

    await new Promise(r => setTimeout(r, 1000));

    methods.broadcastStreamPrevious(body.myUserId, peer);
    
    const answer = await peer.createAnswer();
    
    await peer.setLocalDescription(answer);

    const payload = {
        sdp: peer.localDescription
    }
    
    res.json(payload);

    // await new Promise(r => setTimeout(r, 1000));
    
    // methods.broadcastStreamPrevious(body.myUserId, peer);

}


//socket.io events

io.on('connection', socket => {
    //send socket id to frontend to be used as userId
    // socket.emit('join-room', {
    //     userId: socket.id
    // });

    //get roomId from frontend to make user join the room
    socket.on('join-room', (data) => {
        socket.join(data.roomId);
        
        //send userId of newly connected user to every member of the room
        io.to(data.roomId).emit('user-connected', {
            userId: data.userId,
        });
    });
 
})



module.exports = {
    broadcast,
    view_broadcast_new,
    get_number_of_already_existing_broadcasts,
    view_broadcast_previous
}