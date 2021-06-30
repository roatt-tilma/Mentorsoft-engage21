const socket = io('/');

window.onload = () => {
    init();
} 

var stream;

const peerGuestSend = createPeer();

peerGuestSend.onnegotiationneeded = async () => {
    const offer = await peerGuestSend.createOffer();
    await peerGuestSend.setLocalDescription(offer);

    const payload = {
        sdp: peerGuestSend.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('offer-by-guest', payload);

}

socket.on('answer-by-host', (answer) => {
    answer = new RTCSessionDescription(answer);
    peerGuestSend.setRemoteDescription(answer).catch(e => console.log(e));
});


peerGuestSend.onicecandidate = (e) => {
    const payload = {
        roomId: ROOM_ID,
        candidate: e.candidate
    }

    if(e.candidate){
        socket.emit('candidate-by-guest', payload)
    }
}

const peerGuestReceive = new RTCPeerConnection();

peerGuestReceive.ontrack = (e) => handleOnTrackEvent(e);

socket.on('offer-by-host', async (offer) => {
    
    offer = new RTCSessionDescription(offer);

    await peerGuestReceive.setRemoteDescription(offer);
    const answer = await peerGuestReceive.createAnswer();

    await peerGuestReceive.setLocalDescription(answer);
    const payload = {
        sdp: peerGuestReceive.localDescription,
        roomId: ROOM_ID
    }
    socket.emit('answer-by-guest', payload);
    
});


socket.on('candidate-by-host', (candidate) => {
    const c = new RTCIceCandidate(candidate);
    peerGuestReceive.addIceCandidate(c);
});


socket.on('answer-set-by-host', () => {
    stream.getTracks().forEach(track => peerGuestSend.addTrack(track, stream));
})





const otherVideo = document.getElementById('other-video');
const myVideo = document.getElementById('my-video');

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
    peerGuestReceive.close();
    socket.emit('end-call', {
        roomId: ROOM_ID
    });
    window.location.href = '/';
}

socket.on('end-call', async () => {
    peerGuestReceive.close();
    alert('Host has ended the call. Redirecting to homepage...');
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

    socket.emit('guest-joined', {
        guestId: GUEST_ID,
        roomId: ROOM_ID,
        guestName: GUEST_NAME
    });

    console.log('Guest userId = ' + GUEST_ID);
    console.log('Room Id: ' + ROOM_ID);
}

