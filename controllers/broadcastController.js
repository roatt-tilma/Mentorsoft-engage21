const webrtc = require('wrtc');

let senderStream;

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
    console.log(senderStream);
    senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
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
    
    peer.ontrack = e => handleTrackEvent(e);
    
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    console.log('Hopefully connection is made for video stream ');
    res.json(payload);
}

function handleTrackEvent(e) {
    console.log('Stream Received by server');
    senderStream = e.streams[0];
}

module.exports = {
    broadcast,
    view_broadcast
}