const socket = io('/');

window.onload = () => {
    init();
}

var stream;
var dataChannel;

const peer = createPeer();

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

const otherUsername = document.getElementById('other-username');

const chat_area = document.getElementById('chat-area');

const msg_data = document.getElementById('msg-data');
const msg_send = document.getElementById('msg-send');

const chat_icon = document.getElementById('chat-icon');
const chat_window = document.getElementById('chat-window');

const id_copy = document.getElementById('id-copy');
const password_copy = document.getElementById('password-copy');


const full_overlay = document.getElementById('full-overlay');

async function init() {

    if(USER_TYPE === 'Guest'){
        add_guest_name_to_info();
        full_overlay.innerHTML = 'Waiting for host to start ...';
    }

    if(USER_TYPE === 'Host'){
        full_overlay.innerHTML = 'Waiting for someone to join ...';
    }

    socket.emit('join-room', {
        roomId: ROOM_ID,
    });

}


// join-room is emitted by guest and this code is only accessible by the host

socket.on('join-room', async (roomDet) => {

    GUEST_ID = roomDet.guest.id;
    GUEST_NAME = roomDet.guest.name;

    add_guest_name_to_info();

    dataChannel = peer.createDataChannel('data_channel_webRTC');
    dataChannel.onopen = () => console.log('connection open in Host Side');
    dataChannel.onmessage = (e) => {
        display_msg(GUEST_NAME, e.data);
    };
    
    msg_data.addEventListener('keyup', (e) => {
        if(e.key === 'Enter'){
            e.preventDefault();
            const msg = display_my_message();
            if(msg !== '') {
                dataChannel.send(msg);
            }
        }
    });

    msg_send.onclick = () => {
        const msg = display_my_message();
        if(msg !== '') {
            dataChannel.send(msg);
        }
    }

    full_overlay.innerHTML = '<button id="start-meeting-btn" class="start-meeting-btn">Start Room</button>';

    const start_meeting_btn = document.getElementById('start-meeting-btn');

    start_meeting_btn.onclick = async () => {
        await ask_for_user_media();
        full_overlay.classList.add('hide-full-overlay');
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
        otherUsername.innerText = GUEST_NAME;
        
        socket.emit('meeting-started', {
            roomId: ROOM_ID,
            video_bool
        });
        
        disable_screen_share(); 
    }

});

socket.on('offer', async (offer) => {

    offer = new RTCSessionDescription(offer);

    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();

    await peer.setLocalDescription(answer);

    const payload = {
        sdp: peer.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('answer', payload);
});


socket.on('answer', (answer) => {
    answer = new RTCSessionDescription(answer);
    peer.setRemoteDescription(answer).catch(e => console.log(e));
    can_call_addIceCandidate = 1;
});


socket.on('candidate', (candidate) => {
    candidate = new RTCIceCandidate(candidate);
    peer.addIceCandidate(candidate);
});

socket.on('meeting-started', async () => {
    disable_screen_share();
    otherUsername.innerText = HOST_NAME;
    await ask_for_user_media();
    full_overlay.classList.add('hide-full-overlay');
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
});


// addIceCandidate must only be called after the setRemoteDescription is called ie. answer is set
var can_call_addIceCandidate = 0;



// functionalities of buttons

var video_bool = false;
const my_overlay = document.getElementById('my-overlay');
const other_overlay = document.getElementById('other-overlay');


video_btn.onclick = () => {
    video_bool = !video_bool;
    
    socket.emit('video-on-off', {
        roomId: ROOM_ID,
        video_bool
    });
    
    if (!video_bool){
        my_overlay.classList.remove('hide-overlay');
    } else {
        my_overlay.classList.add('hide-overlay');
    }

    if (video_bool && !share_bool && GUEST_ID) enable_screen_share();
    if (share_bool || !video_bool) disable_screen_share();

    stream.getVideoTracks()[0].enabled = video_bool;
    video_icon.classList.toggle('fa');
    video_icon.classList.toggle('fa-video-camera');
    video_icon.classList.toggle('fas');
    video_icon.classList.toggle('fa-video-slash');
}

socket.on('video-on-off', (bool) => {
    if (!bool){
        other_overlay.classList.remove('hide-overlay');
    } else {
        other_overlay.classList.add('hide-overlay');
    }
});



var audio_bool = false;

audio_btn.onclick = () => {
    audio_bool = !audio_bool;
    stream.getAudioTracks()[0].enabled = audio_bool;
    if(audio_track) audio_track.enabled = audio_bool;
    audio_icon.classList.toggle('fa');
    audio_icon.classList.toggle('fa-microphone');
    audio_icon.classList.toggle('fas');
    audio_icon.classList.toggle('fa-microphone-slash');
}


// chat display 

chat_icon.onclick = () => {
    chat_window.classList.toggle('chat-show');
}

// info display

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
        && e.target.id !== 'id-copy'
        && e.target.id !== 'password-copy'
        && check === 1){
        info.style.display = 'none';
        check = 0;
    }
}

id_copy.onclick = () => {
    copy_helper(id_copy, ROOM_ID);
}

password_copy.onclick = () => {
    copy_helper(password_copy, ROOM_PASSWORD);
}

const aftercall_overlay = () => {
    full_overlay.innerHTML = 'The meeting has ended!';
    full_overlay.classList.remove('hide-full-overlay');
}

end_call_btn.onclick = () => {
    socket.emit('end-call', {
        roomId: ROOM_ID
    });
    stream.getTracks().forEach(track => track.stop());
    aftercall_overlay();
};


socket.on('end-call', () => {
    stream.getTracks().forEach(track => track.stop());
    aftercall_overlay();
});


// screen-share

var share_bool = false;
var audio_track;

screen_share_btn.onclick = async () => {
        
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
        
        const userTrack = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });

        audio_track = userTrack.getAudioTracks()[0];
        audio_track.enabled = audio_bool;

        if (screen.getTracks()){

            screen.getVideoTracks()[0].onended = () => {
                socket.emit('display-stream-ended', {
                    roomId: ROOM_ID
                });
                share_bool = false;
                if(video_bool) enable_screen_share();
                audio_track = null;
            };
    
            disable_screen_share();
            share_bool = true;
     
            screen.getTracks().forEach(track => peer.addTrack(track, screen));
            peer.addTrack(audio_track, screen);

        } 
}


//when screenshare is ended

socket.on('display-stream-ended', () => {
    otherVideo.srcObject = receivedStream;
});


//hide or show user's video

hide_show.onclick = () => {
    my_video_container.classList.toggle('hide');
    hide_show.classList.toggle('fa-chevron-right');
    hide_show.classList.toggle('fa-chevron-left');
}



// functions related to webRTC connection

function createPeer(){

    return new RTCPeerConnection({
        iceServers: [
            {
                urls: 'turn:numb.viagenie.ca',
                credential: 'I1server',
                username: 'roarout20@gmail.com',
            },
            {urls:'stun:stun01.sipphone.com'},
            {urls:'stun:stun.ekiga.net'},
            {urls:'stun:stun.fwdnet.net'},
            {urls:'stun:stun.ideasip.com'},
            {urls:'stun:stun.iptel.org'},
            {urls:'stun:stun.rixtelecom.se'},
            {urls:'stun:stun.schlund.de'},
            {urls:'stun:stun.l.google.com:19302'},
            {urls:'stun:stun1.l.google.com:19302'},
            {urls:'stun:stun2.l.google.com:19302'},
            {urls:'stun:stun3.l.google.com:19302'},
            {urls:'stun:stun4.l.google.com:19302'},
            {urls:'stun:stunserver.org'},
            {urls:'stun:stun.softjoys.com'},
            {urls:'stun:stun.voiparound.com'},
            {urls:'stun:stun.voipbuster.com'},
            {urls:'stun:stun.voipstunt.com'},
            {urls:'stun:stun.voxgratia.org'},
            {urls:'stun:stun.xten.com'},
            {
                urls: 'turn:numb.viagenie.ca',
                credential: 'muazkh',
                username: 'webrtc@live.com'
            },
            {
                urls: 'turn:192.158.29.39:3478?transport=udp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            },
            {
                urls: 'turn:192.158.29.39:3478?transport=tcp',
                credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                username: '28224511:1379330808'
            }
        ]
    });

}

peer.onnegotiationneeded = async () => {

    can_call_addIceCandidate = 0;

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    
    const payload = {
        sdp: peer.localDescription,
        roomId: ROOM_ID
    }

    socket.emit('offer', payload);
}

peer.onconnectionstatechange = (e) => {
    switch (peer.connectionState){
        case 'connected':
            console.log('connection state: connected');
            break;
        case 'disconnected':

            console.log('conneciton state: disconnected');
            if (window.location.href !== '/'){

                peer.close();
                if (USER_TYPE === 'Guest'){
                    alert(`${HOST_NAME} has been disconnected. Redirecting to homepage...`);
                }
                else{
                    alert(`${GUEST_NAME} has been disconnected. Redirecting to homepage...`);
                }
                window.location.href = '/';
                
            }
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


// handle when new stream is sent

var count = 0;
var receivedStream;

peer.ontrack = async (e) => {

    count++;
    if (count === 2){
        receivedStream = e.streams[0];
    }

    otherVideo.srcObject = e.streams[0];

}


//function used in logic to find if the NAT is symmetric

const parseCandidate = (line) => {
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
peer.onicecandidate = (e) => {

    //logic to find if the NAT is symmetric
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
        peer.addIceCandidate(new RTCIceCandidate(e.candidate));
    }

    if (e.candidate){
        socket.emit('candidate', payload);
    }

}

//when new data channel is created - code used only by guest
peer.ondatachannel = e => {
    peer.dc = e.channel;
    peer.dc.onopen = () => console.log('connection open in Guest Side');
    peer.dc.onmessage = (event) =>  {
        display_msg(HOST_NAME, event.data);
    }

    msg_data.addEventListener('keyup', (event) => {
        if(event.key === 'Enter'){
            event.preventDefault();
            const msg = display_my_message();
            if(msg !== '') {
                peer.dc.send(msg);
            }
        }
    });

    msg_send.onclick = () => {
        const msg = display_my_message();
        if(msg !== '') {
            peer.dc.send(msg);
        }
    }
}

peer.addEventListener('icegatheringstatechange', (e) => {
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
});



//user defined functions

const disable_screen_share = () => {
    screen_share_btn.disabled = true;
    screen_share_btn.style.backgroundColor = '#777';
    screen_share_btn.style.cursor = 'auto';
}

const enable_screen_share = () => {
    screen_share_btn.disabled = false;
    screen_share_btn.style.backgroundColor = '#4548f4';
    screen_share_btn.style.cursor = 'pointer';
}

const ask_for_user_media = async () => {
    stream = await navigator.mediaDevices.getUserMedia({
        video: {
            cursor: 'always'
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
        }
    });

    stream.getVideoTracks()[0].enabled = video_bool;
    stream.getAudioTracks()[0].enabled = audio_bool;

    myVideo.srcObject = stream;
    myVideo.muted = true; 

}

// display message in the ui

const display_msg = (sender, message) => {
    const chat_div = document.createElement('div');
    chat_div.classList.add('chat');
    chat_div.innerHTML = `
        <span class="chat-name">${sender}</span>
        <span class="chat-msg">${message}</span>
    `;
    chat_area.appendChild(chat_div);
}

const display_my_message = () => {
    const message = msg_data.value.trim();
    msg_data.value = null;
    if(message !== ''){
        display_msg("You", message);
    }
    return message;
}

const add_guest_name_to_info = () => {
    const guestName = document.createElement('li');
    guestName.classList.add('info-list-elements');
    guestName.appendChild(document.createTextNode('Guest Name: ' + GUEST_NAME));
    info_list.appendChild(guestName);
}

const copy_helper = async (icon, copy_text) => {
    try {
        await navigator.clipboard.writeText(copy_text);
        icon.classList.remove('fa-clipboard');
        icon.classList.add('fa-clipboard-check');
        await new Promise(r => setTimeout(r, 2000));
        icon.classList.remove('fa-clipboard-check');
        icon.classList.add('fa-clipboard');

    }catch(e){
        console.log(e);
    }
}