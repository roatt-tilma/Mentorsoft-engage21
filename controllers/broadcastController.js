const webrtc = require('wrtc');
const User = require('../classes/UserClass');
const { io }  = require('../server');

const userData = [];
const userIds = new Set();
const userDataIndex = new Map();

const setupUser = (roomId, userId) => {
    console.log('When is this running?');
    console.log(userData);
    console.log(userIds);
    console.log(userDataIndex);
    
    if (!userIds.has(userId)){    
        const new_user = new User(roomId, userId);
        userIds.add(userId);
        userData.push(new_user);
        userDataIndex.set(userId, userData.length - 1);
    }  

}

const view_broadcast = async ({ body }, res) => {
    console.log('In viewbroadcast');
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org'
            }
        ]
    });
    
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    //senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }
    res.json(payload);
}

const broadcast = async ({ body }, res) => {
    console.log('New user ' + body.userId + ' entered in the room ' + body.roomId);
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org'
            }
        ]
    });
    
    peer.ontrack = e => handleTrackEvent(e, body.userId);
    setupUser(body.roomId, body.userId);
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
}

function handleTrackEvent(e, userId) {
    const index_in_userData = userDataIndex.get(userId);
    const user = userData[index_in_userData];
    user.userStream = e.streams[0];
    console.log(index_in_userData);
    console.log(user);
    
}

//socket.io events

io.on('connection', socket => {
    console.log('UserId generated ' + socket.id);
 
    socket.emit('join-room', {
        userId: socket.id
    });
 
})

module.exports = {
    broadcast,
    view_broadcast,
    setupUser
}