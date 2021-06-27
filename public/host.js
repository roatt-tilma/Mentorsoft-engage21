const socket = io('/');


window.onload = () => {
    init();
} 


let stream;
let peerHost = createPeer();


socket.on('guest-joined', async (data) => {
    
    console.log('Guest Joined: ' + data.guestId);
    
    console.log('Host Stream: ' + stream);
    peerHost.addStream(stream);

    const offer = await peerHost.createOffer();
    await peerHost.setLocalDescription(offer);

    const payload = {
        sdp: peerHost.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('offer', payload);
})

peerHost.onaddstream = (e) => handleAddStreamEvent(e);

socket.on('answer', (sdp) => {
    peerHost.setRemoteDescription(sdp).catch(e => console.log(e));
});


function createPeer(){
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org",
            },
            {
                url: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            }
        ]
    });

    peer.onicecandidate = e => {
        const payload = {
            candidate: e.candidate,
            roomId: ROOM_ID
        }

        if (e.candidate){
            console.log(e.candidate);
            socket.emit('candidate', payload);
        }
    }

    return peer;
}



function handleAddStreamEvent(e){
    console.log('Stream received');
    console.log('Guest Stream: ' + e.stream);
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


