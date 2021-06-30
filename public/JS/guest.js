const socket = io('/');

window.onload = () => {
    init();
} 


let stream;
let peerGuest = new RTCPeerConnection();

var info_icon = document.getElementById('info-icon');
var info = document.getElementById('info');
var info_list = document.getElementById('info-list'); 

info.style.display = 'none';
var check = 0;



info_icon.onclick = () =>{
    if(check === 0){
        info.style.display = 'block';
        check = 1;
    }
    else{
        info.style.display = 'none';
        check = 0;
    }
}

info_icon.onmouseover = () =>{
    info.style.display = 'block';
}

info_icon.onmouseout = () =>{
    if(check===0){
    info.style.display = 'none';
    }
}

document.onclick = (e) =>{
    if(e.target.id !== 'info' 
        && e.target.id !== 'info-icon'
        && e.target.id !== 'info-list' 
        && e.target.className !== 'info-list-elements'
        && check === 1){
        info.style.display = 'none';
        check = 0;
    }
}


socket.on('offer', async (offer) => {
    
    offer = new RTCSessionDescription(offer);

    stream.getTracks().forEach(track => peerGuest.addTrack(track, stream));

    await peerGuest.setRemoteDescription(offer);
    const answer = await peerGuest.createAnswer();

    await peerGuest.setLocalDescription(answer);
    const payload = {
        sdp: peerGuest.localDescription,
        roomId: ROOM_ID
    }
    socket.emit('answer', payload);
    
});

peerGuest.ontrack = (e) => handleOnTrackEvent(e);

socket.on('candidate', (candidate) => {
    candidate = new RTCIceCandidate(candidate);
    peerGuest.addIceCandidate(candidate);
});


function handleOnTrackEvent(e){
    console.log('Stream received');
    console.log('Host Stream: ' + e.streams[0]);
    const otherVideo = document.getElementById('other-video');
    otherVideo.srcObject = e.streams[0];

    otherVideo.onloadedmetadata = () => {
        console.log('video aayo re aayo re aayo');
    }
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
        roomId: ROOM_ID,
        guestName: GUEST_NAME
    });

    console.log('Guest userId = ' + GUEST_ID);
    console.log('Room Id: ' + ROOM_ID);
}

