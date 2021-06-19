const socket = io('/');
let USER_ID;

window.onload = () => {
    init();
}

socket.on('join-room', (data) => {
   USER_ID = data.userId;     
});

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
    const peerSend = createPeer('/broadcast');
    stream.getTracks().forEach(track => peerSend.addTrack(track, stream));
    const peerRecieve = createPeer('/broadcast/viewbroadcast');
    peerRecieve.addTransceiver('video', { direction: 'recvonly' });
    peerRecieve.ontrack = e => handleTrackEvent(e);
}

function createPeer(url){
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, url);

    return peer;
}

async function handleNegotiationNeededEvent(peer, url){
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
        roomId: ROOM_ID,
        userId: USER_ID
    }
    const { data } = await axios.post(`${url}`, payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
} 


function handleTrackEvent(e){
    const videoGrid = document.getElementById('video-grid');
    const broadcastVideo = document.createElement('video');
    broadcastVideo.srcObject = e.streams[0];
    broadcastVideo.play();
    videoGrid.appendChild(broadcastVideo);
}