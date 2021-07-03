const socket = io('/');

window.onload = () => {
    init();
}

var stream;
var dataChannel;

const peerHost = createPeer();
const peerGuest = new RTCPeerConnection();

const myVideo = document.getElementById('my-video');
const otherVideo = document.getElementById('other-video');

const video_btn = document.getElementById('video-btn');
const video_icon = document.getElementById('video-icon');

const audio_btn = document.getElementById('audio-btn');
const audio_icon = document.getElementById('audio-icon');

const screen_share_btn = document.getElementById('screen-share-btn');
const screen_share_icon = document.getElementById('screen-share-icon');

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
        stream.getTracks().forEach(track => peerGuest.addTrack(track, stream));
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

    dataChannel = peerHost.createDataChannel('data_channel_webRTC');
    dataChannel.onopen = () => console.log('connection open in Host Side');
    dataChannel.onmessage = (e) => console.log('Message received in Host Side: ' + e.data);
    
    stream.getTracks().forEach(track => peerHost.addTrack(track, stream));
    
});

socket.on('offer', async (offer) => {

    offer = new RTCSessionDescription(offer);
    

    // console.log('offer received');
    // console.log(offer);

    await peerGuest.setRemoteDescription(offer);
    const answer = await peerGuest.createAnswer();

    await peerGuest.setLocalDescription(answer);

    const payload = {
        sdp: peerGuest.localDescription,
        roomId: ROOM_ID
    }

    // console.log('answer sent');
    // console.log(payload.sdp);

    socket.emit('answer', payload);
});


socket.on('answer', (answer) => {
    answer = new RTCSessionDescription(answer);

    // console.log('answer received');
    // console.log(answer);

    peerHost.setRemoteDescription(answer).catch(e => console.log(e));

    can_call_addIceCandidate = 1;

});


socket.on('candidate', (candidate) => {

        candidate = new RTCIceCandidate(candidate);
        
        // console.log('received candidate');
        // console.log(candidate);

        peerGuest.addIceCandidate(candidate);

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
    peerHost.close();
    peerGuest.close();
    socket.emit('end-call', {
        roomId: ROOM_ID
    });
    window.location.href = '/';
}

socket.on('end-call', async () => {
    peerHost.close();
    peerGuest.close();
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

        screen.getTracks().forEach(track => peerHost.addTrack(track, screen));
}



hide_show.onclick = () => {
    myVideo.classList.toggle('hide');
    hide_show.classList.toggle('fa-chevron-right');
    hide_show.classList.toggle('fa-chevron-left');
}


// functions related to webRTC connection


function createPeer(){
    // return new RTCPeerConnection({
    //     iceServers: [
    //         {
    //             urls: 'turn:numb.viagenie.ca',
    //             credential: 'I1server',
    //             username: 'roarout20@gmail.com'
    //         },
    //         { 
    //             urls: 'stun:stun.l.google.com:19302' 
    //         }
    //     ]
    // });

    return new RTCPeerConnection({
        iceServers: [
            {urls: 'stun:stun1.l.google.com:19302'},
            {urls: 'stun:stun2.l.google.com:19302'}
        ]
    });

    // return new RTCPeerConnection();

    // return new RTCPeerConnection({
    //     iceServers: [
    //         {
    //             url: 'turn:numb.viagenie.ca',
    //             credential: 'I1server',
    //             username: 'roarout20@gmail.com',
    //         },
    //         {urls:'stun:stun01.sipphone.com'},
    //         {urls:'stun:stun.ekiga.net'},
    //         {urls:'stun:stun.fwdnet.net'},
    //         {urls:'stun:stun.ideasip.com'},
    //         {urls:'stun:stun.iptel.org'},
    //         {urls:'stun:stun.rixtelecom.se'},
    //         {urls:'stun:stun.schlund.de'},
    //         {urls:'stun:stun.l.google.com:19302'},
    //         {urls:'stun:stun1.l.google.com:19302'},
    //         {urls:'stun:stun2.l.google.com:19302'},
    //         {urls:'stun:stun3.l.google.com:19302'},
    //         {urls:'stun:stun4.l.google.com:19302'},
    //         {urls:'stun:stunserver.org'},
    //         {urls:'stun:stun.softjoys.com'},
    //         {urls:'stun:stun.voiparound.com'},
    //         {urls:'stun:stun.voipbuster.com'},
    //         {urls:'stun:stun.voipstunt.com'},
    //         {urls:'stun:stun.voxgratia.org'},
    //         {urls:'stun:stun.xten.com'},
    //         {
    //             urls: 'turn:numb.viagenie.ca',
    //             credential: 'muazkh',
    //             username: 'webrtc@live.com'
    //         },
    //         {
    //             urls: 'turn:192.158.29.39:3478?transport=udp',
    //             credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //             username: '28224511:1379330808'
    //         },
    //         {
    //             urls: 'turn:192.158.29.39:3478?transport=tcp',
    //             credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //             username: '28224511:1379330808'
    //         }
    //     ]
    // });
}

const handleOnConnectionStateChange = (e, peer) => {
    switch (peer.connectionState){
        case 'connected':
            console.log('connection state: connected');
            break;
        case 'disconnected':
            console.log('conneciton state: disconnected');
            break;
        case 'closed':
            console.log('connection state: closed');
            break;
        case 'connecting':
            console.log('connection state: connecting');
            break;
        case 'failed':
            console.log('connection state: failed');
            break;
        case 'new':
            console.log('connection state: new');
            break;
    }
}


peerHost.onconnectionstatechange = (e) => handleOnConnectionStateChange(e, peerHost);
peerGuest.onconnectionstatechange = (e) => handleOnConnectionStateChange(e, peerGuest);


var receivedStream;
var count = 0;


const handleOnTrackEvent = async (e) => {
    count++;
    // console.log('New Track:');
    // console.log(e.streams[0]);

    if (count === 2){
        receivedStream = e.streams[0]
    }

    otherVideo.srcObject = e.streams[0];

    if (count >= 3){
        await new Promise(r => setTimeout(r, 8000));
        otherVideo.srcObject = receivedStream;
    }
}

peerHost.ontrack = handleOnTrackEvent;
peerGuest.ontrack = handleOnTrackEvent;

function parseCandidate(line) {
    var parts;
    // Parse both variants.
    if (line.indexOf('a=candidate:') === 0) {
      parts = line.substring(12).split(' ');
    } else {
      parts = line.substring(10).split(' ');
    }
  
    var candidate = {
      foundation: parts[0],
      component: parts[1],
      protocol: parts[2].toLowerCase(),
      priority: parseInt(parts[3], 10),
      ip: parts[4],
      port: parseInt(parts[5], 10),
      // skip parts[6] == 'typ'
      type: parts[7]
    };
  
    for (var i = 8; i < parts.length; i += 2) {
      switch (parts[i]) {
        case 'raddr':
          candidate.relatedAddress = parts[i + 1];
          break;
        case 'rport':
          candidate.relatedPort = parseInt(parts[i + 1], 10);
          break;
        case 'tcptype':
          candidate.tcpType = parts[i + 1];
          break;
        default: // Unknown extensions are silently ignored.
          break;
      }
    }
    return candidate;
  }



var candidates = {};
peerHost.onicecandidate = (e) => {


    if (e.candidate && e.candidate.candidate.indexOf('srflx') !== -1) {
        var cand = parseCandidate(e.candidate.candidate);
        if (!candidates[cand.relatedPort]) candidates[cand.relatedPort] = [];
        candidates[cand.relatedPort].push(cand.port);
      } else if (!e.candidate) {
        if (Object.keys(candidates).length === 1) {
          var ports = candidates[Object.keys(candidates)[0]];
          console.log(ports.length === 1 ? 'normal nat' : 'symmetric nat');
        }
      }


    const payload = {
        candidate: e.candidate,
        roomId: ROOM_ID
    }

    
    if (e.candidate && can_call_addIceCandidate === 1){
        // console.log('added new candidate in self');
        // console.log(e.candidate);
        peerHost.addIceCandidate(new RTCIceCandidate(e.candidate));
    }

    if (e.candidate){
        // console.log('new candidate sent: ');
        // console.log(payload.candidate);
        socket.emit('candidate', payload);
    }

}

peerHost.onnegotiationneeded = async () => {
    const offer = await peerHost.createOffer();
    await peerHost.setLocalDescription(offer);
    
    const payload = {
        sdp: peerHost.localDescription,
        roomId: ROOM_ID
    }
    
    // console.log('offer sent from host:');
    // console.log(payload.sdp);

    socket.emit('offer', payload);
}


peerGuest.ondatachannel = e => {
    peerGuest.dc = e.channel;
    peerGuest.dc.onopen = () => console.log('connection open in Guest Side');
    peerGuest.dc.onmessage = (e) =>  console.log('Message received in Guest Side: ' + e.data);
}


const handleIceGatheringStateChange = (e, peer) => {
    switch(peer.iceGatheringState) {
        case 'new':
          console.log('iceGatheringState: new');
          break;
        case 'gathering':
          console.log('iceGatheringState: gathering');
          break;
        case 'complete':
          console.log('iceGatheringState: complete');
          break;
    }
}

peerHost.addEventListener('icegatheringstatechange', (e) => handleIceGatheringStateChange(e, peerHost));
peerGuest.addEventListener('icegatheringstatechange', (e) => handleIceGatheringStateChange(e, peerGuest));