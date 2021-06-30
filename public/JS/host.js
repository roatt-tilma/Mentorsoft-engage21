const socket = io('/');

window.onload = () => {
    init();
} 

var stream;

const peerHostSend = createPeer();

peerHostSend.onnegotiationneeded = async () => {

    const offer = await peerHostSend.createOffer();
    await peerHostSend.setLocalDescription(offer);

    const payload = {
        sdp: peerHostSend.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('offer-by-host', payload);
}

peerHostSend.onicecandidate = (e) => {
    const payload = {
        roomId: ROOM_ID,
        candidate: e.candidate
    }

    if(e.candidate){
        socket.emit('candidate-by-host', payload)
    }
}

socket.on('guest-joined', async (data) => {
    
    console.log('Guest Joined: ' + data.guestId);
    
    console.log('Host Stream: ' + stream);

    const guestName = document.createElement('li');
    guestName.classList.add('info-list-elements');
    guestName.appendChild(document.createTextNode('Guest Name: ' + data.guestName));
    info_list.appendChild(guestName);

    stream.getTracks().forEach(track => peerHostSend.addTrack(track, stream));

});

socket.on('answer-by-guest', (answer) => {
    answer = new RTCSessionDescription(answer);
    peerHostSend.setRemoteDescription(answer).catch(e => console.log(e));

    socket.emit('answer-set-by-host', ROOM_ID);
});


const peerHostReceive = new RTCPeerConnection();

peerHostReceive.ontrack = (e) => handleOnTrackEvent(e);

socket.on('offer-by-guest', async (offer) => {

    offer = new RTCSessionDescription(offer);

    await peerHostReceive.setRemoteDescription(offer);
    const answer = await peerHostReceive.createAnswer();

    await peerHostReceive.setLocalDescription(answer);
    const payload = {
        sdp: peerHostReceive.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('answer-by-host', payload);
    
});

socket.on('candidate-by-guest', (candidate) => {
    const c = new RTCIceCandidate(candidate);
    peerHostReceive.addIceCandidate(c);
});



const otherVideo = document.getElementById('other-video');
const myVideo = document.getElementById('my-video');

const video_btn = document.getElementById("video-btn");
const audio_btn = document.getElementById("audio-btn");


const video_icon = document.getElementById("video-icon");
const audio_icon = document.getElementById("audio-icon");

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

const info_icon = document.getElementById('info-icon');
const info = document.getElementById('info');
const info_list = document.getElementById('info-list'); 

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
    peerHostSend.close();
    socket.emit('end-call', {
        roomId: ROOM_ID
    });
    window.location.href = '/';
}



const screen_share_btn = document.getElementById("screen-share-btn");
const screen_share_icon = document.getElementById("screen-share-icon");

var share_bool = false;

screen_share_btn.onclick = async () => {
    if (!share_bool){
        share_bool = !share_bool;
        const screen = await navigator.mediaDevices.getDisplayMedia();
        stream.getTracks().forEach(track => peerHostSend.removeTrack(track, stream));
        screen.getTracks().forEach(track => peerHostSend.addTrack(track, screen));
        screen.getVideoTracks()[0].onended = () => {
            share_bool = !share_bool;
            stream.getTracks().forEach(track => peerHostSend.addTrack(track, stream));
        }
    }
    
}


socket.on('end-call', async () => {
    peerHostSend.close();
    alert('Guest has ended the call. Redirecting to homepage...');
    await new Promise(r => setTimeout(r, 3000));
    window.location.href = '/';
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
    console.log('Host Stream: ' + e.streams[0]);

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


