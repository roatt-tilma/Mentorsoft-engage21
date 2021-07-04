const socket = io('/');

window.onload = () => {
    init();
}

var stream;
var dataChannel;

const peer = createPeer();

const myVideo = document.getElementById('my-video');
const otherVideo = document.getElementById('other-video');

const video_btn = document.getElementById("video-btn");
const video_icon = document.getElementById("video-icon");

const audio_btn = document.getElementById("audio-btn");
const audio_icon = document.getElementById("audio-icon");

const screen_share_btn = document.getElementById("screen-share-btn");
const screen_share_icon = document.getElementById("screen-share-icon");

const end_call_btn = document.getElementById('end-call-btn');

const info_icon = document.getElementById('info-icon');
const info = document.getElementById('info');
const info_list = document.getElementById('info-list');

const hide_show = document.getElementById('hide-show');
const my_video_container = document.getElementById('my-video-container');

const guestName = document.createElement('li');
guestName.classList.add('info-list-elements');


async function init() {

    stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });

    if(GUEST_NAME){
        guestName.appendChild(document.createTextNode('Guest Name: ' + GUEST_NAME));
        info_list.appendChild(guestName);
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
        screen_share_btn.style.display = 'none';
    }


    stream.getVideoTracks()[0].enabled = video_bool;
    stream.getAudioTracks()[0].enabled = audio_bool;

    myVideo.srcObject = stream;
    myVideo.muted = true; 
    
    socket.emit('join-room', {
        roomId: ROOM_ID,
    });

}

//make connection between the guest and the host

socket.on('join-room', async (roomDet) => {
    
    GUEST_ID = roomDet.guest.id;
    GUEST_NAME = roomDet.guest.name;

    guestName.appendChild(document.createTextNode('Guest Name: ' + GUEST_NAME));
    info_list.appendChild(guestName);
    
    peer.onnegotiationneeded = async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        
        const payload = {
            sdp: peer.localDescription,
            roomId: ROOM_ID
        }
        
        console.log('offer sent:');
        console.log(payload.sdp);

        socket.emit('offer', payload);
    }

    
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    
});

socket.on('offer', async (offer) => {

    offer = new RTCSessionDescription(offer);
    

    console.log('offer received');
    console.log(offer);

    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();

    await peer.setLocalDescription(answer);

    const payload = {
        sdp: peer.localDescription,
        roomId: ROOM_ID
    }

    console.log('answer sent');
    console.log(payload.sdp);

    socket.emit('answer', payload);
});


socket.on('answer', (answer) => {
    answer = new RTCSessionDescription(answer);

    console.log('answer received');
    console.log(answer);

    peer.setRemoteDescription(answer).catch(e => console.log(e));

    can_call_addIceCandidate = 1;

});


socket.on('candidate', (candidate) => {

        candidate = new RTCIceCandidate(candidate);
        
        console.log('received candidate');
        console.log(candidate);

        peer.addIceCandidate(candidate);

})


// addIceCandidate must only be called after the setRemoteDescription is called ie. answer is set
var can_call_addIceCandidate = 0;



// functionalities of buttons


var video_bool = false;

video_btn.onclick = () => {
    video_bool = !video_bool;
    stream.getVideoTracks()[0].enabled = video_bool;
    video_icon.classList.toggle('fa');
    video_icon.classList.toggle('fa-video-camera');
    video_icon.classList.toggle('fas');
    video_icon.classList.toggle('fa-video-slash');
}


var audio_bool = false;

audio_btn.onclick = () => {
    audio_bool = !audio_bool;
    stream.getAudioTracks()[0].enabled = audio_bool;
    audio_icon.classList.toggle('fa');
    audio_icon.classList.toggle('fa-microphone');
    audio_icon.classList.toggle('fas');
    audio_icon.classList.toggle('fa-microphone-slash');
}


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
        && e.target.id !== 'arrow'
        && check === 1){
        info.style.display = 'none';
        check = 0;
    }
}


end_call_btn.onclick = () => {
    peer.close();
    socket.emit('end-call', {
        roomId: ROOM_ID
    });
    window.location.href = '/';
}

socket.on('end-call', async () => {
    peer.close();
    alert('Other user has ended the call. Redirecting to homepage...');
    await new Promise(r => setTimeout(r, 3000));
    window.location.href = '/';
});


var share_bool = false;

screen_share_btn.onclick = async () => {
        share_bool = !share_bool;

        const screen = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always'
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });

        screen.getVideoTracks()[0].onended = () => {
            socket.emit('display-stream-ended', {
                roomId: ROOM_ID
            })
        };
 
        screen.getTracks().forEach(track => peer.addTrack(track, screen));
}


socket.on('display-stream-ended', () => {
    otherVideo.srcObject = receivedDisplayStream;
});


hide_show.onclick = () => {
    myVideo.classList.toggle('hide');
    hide_show.classList.toggle('fa-chevron-right');
    hide_show.classList.toggle('fa-chevron-left');
}


// functions related to webRTC connection


function createPeer(){
    return new RTCPeerConnection({
        iceServers: [
            {
                url: "turn:numb.viagenie.ca",
                credential: "I1server",
                username: "roarout20@gmail.com",
            },
            {
                urls: "turn:numb.viagenie.ca",
                credential: "Roatt@tilma12",
                username: "roshanbhattmnr@gmail.com"
            },
            { 
                urls: "stun:stun.l.google.com:19302" 
            }
        ]
    });
}


peer.onconnectionstatechange = (e) => {
    switch (peer.connectionState){
        case 'connected':
            can_call_addIceCandidate = 0;
            console.log('connection state connected');
            console.log(e);
            break;
        case 'disconnected':
            console.log('conneciton state disconnected');
            console.log(e);
            break;
        case 'closed':
            console.log('connection state closed');
            console.log(e);
            break;
        case 'connecting':
            console.log('connection state connecting');
            console.log(e);
            break;
        case 'failed':
            console.log('connection state failed');
            console.log(e);
            break;
        case 'new':
            console.log('connection state new');
            console.log(e);
            break;
    }
}


var count = 0;
var receivedDisplayStream;

peer.ontrack = async (e) => {

    count++;
    if (count === 2){
        receivedDisplayStream = e.streams[0];
    }
    otherVideo.srcObject = e.streams[0];

}