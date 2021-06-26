const socket = io('/');

window.onload = () => {
    init();
} 

socket.on('host-calling-guest-for-sending-stream', async (hostData) => {
    const peerReceive = await createPeer(hostData.sdp);
    
    const payload = {
        sdp: peerReceive.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('guest-response-for-receiving-stream-from-host', payload);
});

//this function will run when someone enters the room
async function init() {

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    const myVideoHolder = document.getElementById('my-video');
    const myVideo = document.createElement('video');
    myVideo.srcObject = stream;
    myVideo.muted = true;
    myVideo.play();
    myVideoHolder.appendChild(myVideo);

    socket.emit('guest-joined', {
        guestId: GUEST_ID,
        roomId: ROOM_ID
    });

    console.log('Guest userId = ' + GUEST_ID);
    console.log('Room Id: ' + ROOM_ID);
}


//this function creates a connection with the other user's browser
async function createPeer(sdp){
    const peer = new RTCPeerConnection({
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

    peer.ontrack = e => handleTrackEvent(e);

    const desc = new RTCSessionDescription(sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    
    return peer;
}

const videoGrid = document.getElementById('video-grid');

//handles incoming user media
function handleTrackEvent(e){
    const otherVideo = document.getElementById('other-video');
    otherVideo.srcObject = e.streams;
    otherVideo.muted = true;
    otherVideo.play();
}