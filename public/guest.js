const socket = io('/');

window.onload = () => {
    init();
} 


let stream;
let peerGuest = createPeer();

socket.on('offer', async (sdp) => {
    
    console.log('Guest Stream: ' + stream);
    peerGuest.addStream(stream);

    await peerGuest.setRemoteDescription(sdp);
    const answer = await peerGuest.createAnswer();
    await peerGuest.setLocalDescription(answer);
    const payload = {
        sdp: peerGuest.localDescription,
        roomId: ROOM_ID
    }
    socket.emit('answer', payload);
});

peerGuest.onaddstream = (e) => handleAddStreamEvent(e);

socket.on('candidate', (candidate) => {
    console.log(candidate);
    const c = new RTCIceCandidate(candidate);
    peerGuest.addIceCandidate(c);
});


function createPeer(){
    return new RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.stunprotocol.org'
            },
            {
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            }
        ]
    });
}


function handleAddStreamEvent(e){
    console.log('Stream received');
    console.log('Host Stream: ' + e.stream);
    const otherVideo = document.getElementById('other-video');
    otherVideo.srcObject = e.stream;
}


async function init() {
    
    stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    const myVideo = document.getElementById('my-video');
    myVideo.srcObject = stream;
    myVideo.muted = true;

    socket.emit('guest-joined', {
        guestId: GUEST_ID,
        roomId: ROOM_ID
    });

    console.log('Guest userId = ' + GUEST_ID);
    console.log('Room Id: ' + ROOM_ID);
}

