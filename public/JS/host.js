const socket = io('/');

window.onload = () => {
    init();
} 

let stream;
let peerHost = createPeer();

const video_btn = document.getElementById("video-btn");
const audio_btn = document.getElementById("audio-btn");
const screen_share_btn = document.getElementById("screen-share-btn");
const end_call_btn = document.getElementById("end-call-btn");

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


socket.on('guest-joined', async (data) => {
    
    console.log('Guest Joined: ' + data.guestId);
    
    console.log('Host Stream: ' + stream);

    const guestName = document.createElement('li');
    guestName.classList.add('info-list-elements');
    guestName.appendChild(document.createTextNode('Guest Name: ' + data.guestName));
    info_list.appendChild(guestName);


    
    stream.getTracks().forEach(track => peerHost.addTrack(track, stream));

    const offer = await peerHost.createOffer();
    await peerHost.setLocalDescription(offer);

    const payload = {
        sdp: peerHost.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('offer', payload);

})

peerHost.ontrack = (e) => handleOnTrackEvent(e);

peerHost.onicecandidate = (e) => {

    const payload = {
        candidate: e.candidate,
        roomId: ROOM_ID
    }

    if (e.candidate){
        console.log(e.candidate);
        socket.emit('candidate', payload);
    }

}

socket.on('answer', (answer) => {
    answer = new RTCSessionDescription(answer);
    peerHost.setRemoteDescription(answer).catch(e => console.log(e));
});



function createPeer(){
    return new RTCPeerConnection({
        iceServers: [
            { 
                url: "stun:stun.l.google.com:19302" 
            },
            {
                url: "turn:numb.viagenie.ca",
                credential: "I1server",
                username: "roarout20@gmail.com",
            }
        ]
    });
}


function handleOnTrackEvent(e){
    console.log('Stream received');
    console.log('Guest Stream: ' + e.streams[0]);
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
    myVideo.play();
    
    socket.emit('room-created', {
        roomId: ROOM_ID,
        roomName: ROOM_NAME,
        roomPassword: ROOM_PASSWORD,
        hostId: HOST_ID,
        hostName: HOST_NAME
    });

    console.log('Host userId: ' + HOST_ID);
    console.log('Room Id: ' + ROOM_ID);
    console.log('Room Password: ' + ROOM_PASSWORD);

}


