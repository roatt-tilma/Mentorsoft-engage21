const socket = io('/');

window.onload = () => {
    init();
} 


let stream;
let peerGuest = new RTCPeerConnection();

const video_btn = document.getElementById("video-btn");
const audio_btn = document.getElementById("audio-btn");
const screen_share_btn = document.getElementById("screen-share-btn");

const video_icon = document.getElementById("video-icon");
const audio_icon = document.getElementById("audio-icon");
const screen_share_icon = document.getElementById("screen-share-icon");

var video_bool = true;
var audio_bool = true;

video_btn.onclick = () => {
    video_bool = !video_bool;
    stream.getVideoTracks()[0].enabled = video_bool;
    video_icon.classList.toggle('fa');
    video_icon.classList.toggle('fa-video-camera');
    video_icon.classList.toggle('fas');
    video_icon.classList.toggle('fa-video-slash');
}

audio_btn.onclick = () => {
    audio_bool = !video_bool;
    stream.getAudioTracks()[0].enabled = audio_bool;
    audio_icon.classList.toggle('fa');
    audio_icon.classList.toggle('fa-microphone');
    audio_icon.classList.toggle('fas');
    audio_icon.classList.toggle('fa-microphone-slash');

}

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


const end_call_btn = document.getElementById('end-call-btn');

end_call_btn.onclick = () => {
    peerGuest.close();
    socket.emit('end-call', {
        roomId: ROOM_ID
    });
    window.location.href = '/';
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


socket.on('end-call', async () => {
    peerGuest.close();
    alert('Host has ended the call. Redirecting to homepage...');
    await new Promise(r => setTimeout(r, 3000));
    window.location.href = '/';
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

