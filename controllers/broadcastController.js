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
    
    peer.ontrack = e => handleTrackEvent(e, peer);
    
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
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
    
    peer.ontrack = e => handleTrackEvent(e, peer);
    
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }
    res.json(payload);
    console.log('Hopefully connection is made for video stream ');
}

function handleTrackEvent(e, peer) {
    console.log('Stream Received by server');
    senderStream = e.streams[0];
}

module.exports = {
    broadcast,
    view_broadcast
}