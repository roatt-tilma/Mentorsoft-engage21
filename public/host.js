const socket = io('/');


window.onload = () => {
    init();
} 

let peerSend;

//respond when guest is connected
socket.on('guest-joined', async (data) => {
    console.log('Guest Joined: ' + data.guestId);
    peerSend = createPeer(); 
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    
    stream.getTracks().forEach(track => peerSend.addTrack(track, stream)); 
})

socket.on('guest-response-for-receiving-stream-from-host', (guestData) => {
    const desc = new RTCSessionDescription(guestData.sdp);
    peerSend.setRemoteDescription(desc).catch(e => console.log(e));
});

async function init() {

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
    const myVideo = document.getElementById('my-video');
    myVideo.srcObject = stream;
    myVideo.muted = true;
    myVideo.play();
    
    socket.emit('room-created', {
        roomId: ROOM_ID,
        roomName: ROOM_NAME,
        roomPassword: ROOM_PASSWORD,
        hostId: HOST_ID,
        hostName: HOST_NAME
    });

    console.log('Host userId = ' + HOST_ID);
    console.log('Room Id: ' + ROOM_ID);
}


//this function creates a connection with the other user's browser
function createPeer(){
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org",
            },
            {
                urls: "turn:13.250.13.83:3478?transport=udp",
                username: "YzYNCouZM1mhqhmseWk6",
                credential: "YzYNCouZM1mhqhmseWk6"
            }
        ]
    });
    
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
}

//function used in createPeer
async function handleNegotiationNeededEvent(peer){
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const payload = {
        sdp: peer.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('host-calling-guest-for-sending-stream', payload);
} 

const videoGrid = document.getElementById('video-grid');

//handles incoming user media
function handleTrackEvent(e){
    const otherVideo = document.getElementById('other-video');
    otherVideo.srcObject = e.streams[0];
    otherVideo.muted = true;
    otherVideo.play();
}