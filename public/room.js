const socket = io('/');

window.onload = () => {
    init();
}

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
    const peer = createpeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}

function createpeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    
    return peer;
}

async function handleNegotiationNeededEvent(peer){
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    }
    const { data } = await axios.post('/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}