const socket = io('/');

window.onload = () => {
    init();
}

var stream;
var peerGuest = null;
var peerHost = null;
var dataChannel;

var receivedStreamCount = 0;
var receivedStream;


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
const full_overlay_content = document.getElementById('full-overlay-content');

const other_video_container = document.getElementById('other-video-container');

async function init() {

    if(USER_TYPE === 'Guest'){
        if (peerGuest === null) peerGuest = createPeer();
        add_guest_name_to_info();
        const information = 'Waiting for host to start...';
        show_full_overlay_content_for_guest(information);
    }

    if(USER_TYPE === 'Host'){
        const information = 'Waiting for someone to join...<br><br>You can start chatting as soon as someone joins!';
        show_full_overlay_content_for_host(information);
        disable_chat();
    }

    socket.emit('join-room', {
        roomId: ROOM_ID,
    });

}


// join-room is emitted by guest and this code is only accessible by the host

socket.on('join-room', async (roomDet) => {

    if (peerHost === null) peerHost =  createPeer();

    GUEST_ID = roomDet.guest.id;
    GUEST_NAME = roomDet.guest.name;

    add_guest_name_to_info();

    dataChannel = peerHost.createDataChannel(GUEST_ID);
    dataChannel.onopen = () => {
        console.log('connection open in Host Side');
        enable_chat();
    }
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
            console.log(dataChannel.readyState);
            dataChannel.send(msg);
        }
    }

    const information = '<button id="start-meeting-btn" class="start-meeting-btn">Start Meeting</button>';

    show_full_overlay_content_for_host(information);

    const start_meeting_btn = document.getElementById('start-meeting-btn');

    start_meeting_btn.onclick = async () => {
        try{
            await ask_for_user_media();
            start_meeting_btn.disabled = true;
            full_overlay.classList.add('hide-full-overlay');
            stream.getTracks().forEach(track => peerHost.addTrack(track, stream));
            otherUsername.innerText = GUEST_NAME;
            
            socket.emit('meeting-started', {
                roomId: ROOM_ID,
                video_bool
            });
            disable_screen_share(); 
        }catch(e){
            alert('Allow us to use your camera and microphone to continue!!');
        }
    }

});

socket.on('offer', async (offer) => {

    var peer = get_relevant_peer() ;

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
    var peer = get_relevant_peer();

    answer = new RTCSessionDescription(answer);
    peer.setRemoteDescription(answer).catch(e => console.log(e));
    can_call_addIceCandidate = 1;
});


socket.on('candidate', (candidate) => {

    var peer = get_relevant_peer();

    candidate = new RTCIceCandidate(candidate);
    peer.addIceCandidate(candidate);
});

socket.on('meeting-started', async () => {
    try{
        var peer = get_relevant_peer();
        
        disable_screen_share();
        otherUsername.innerText = HOST_NAME;
        await ask_for_user_media();
        full_overlay.classList.add('hide-full-overlay');
        stream.getTracks().forEach(track => peer.addTrack(track, stream));
    }catch(e){
        alert('Allow us to use your camera and microphone to continue!!');
    }
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
    console.log(audio_track);
    if(audio_track !== null) audio_track.enabled = audio_bool;
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


end_call_btn.onclick = () => {
    socket.emit('meeting-ended', {
        roomId: ROOM_ID
    });

    stream.getTracks().forEach(track => track.stop());

    if (screen){
        screen.getTracks().forEach(track => track.stop());
    }

    if (audio_track){
        audio_track.stop();
    }

    

    if(USER_TYPE === 'Host'){
        const information = 'The meeting has ended!';
        show_full_overlay_content_for_host(information);
    } 
    else{
        const information = 'The meeting has ended!';
        show_full_overlay_content_for_guest(information);
    }

    full_overlay.classList.remove('hide-full-overlay');
};


socket.on('meeting-ended', () => {
    stream.getTracks().forEach(track => track.stop());
    
    if (screen !== null){
        screen.getTracks().forEach(track => track.stop());
    }

    if (audio_track !== null){
        audio_track.stop();
    }

    if(USER_TYPE === 'Host'){
        const information = 'The meeting has ended!';
        show_full_overlay_content_for_host(information);
    } 
    else{
        const information = 'The meeting has ended!';
        show_full_overlay_content_for_guest(information);
    }

    full_overlay.classList.remove('hide-full-overlay');
});

socket.on('room-left', () => {
    var peer = get_relevant_peer();
    dataChannel.close();
    peer.close();
    remove_guest_name_from_info();
    alert(`${GUEST_NAME} has left the room! Redirecting to homepage...`);
    // const information = 'Waiting for someone to join...<br><br>You can start chatting as soon as someone joins!';
    // show_full_overlay_content_for_host(information);
    // disable_chat();
    window.location.href = '/';
});

socket.on('room-ended', () => {
    
    var peer = get_relevant_peer();

    peer.close();
    alert(`${HOST_NAME} has ended the room! Redirecting to homepage...`);
    window.location.href = '/';
});


// screen-share

var share_bool = false;
var audio_track = null;
var screen = null;

screen_share_btn.onclick = async () => {

    try{
        var peer = get_relevant_peer();

        screen = await navigator.mediaDevices.getDisplayMedia({
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

        if (screen.getTracks()){

            audio_track = userTrack.getAudioTracks()[0];
            audio_track.enabled = audio_bool;

            screen.getVideoTracks()[0].onended = () => {
                socket.emit('display-stream-ended', {
                    roomId: ROOM_ID
                });
                share_bool = false;
                if(video_bool) enable_screen_share();
                audio_track = null;
                screen = null;
            };

            disable_screen_share();
            share_bool = true;
        
            screen.getTracks().forEach(track => peer.addTrack(track, screen));
            peer.addTrack(audio_track, screen);

        } 
    }catch(e){
        console.log(e);
    }

}


//when screenshare is ended

socket.on('display-stream-ended', () => {
    otherVideo.srcObject = receivedStream;
});


//double click to toggle full screen mode

document.ondblclick = () => {
    toggle_fullscreen();
}

//hide or show user's video

hide_show.onclick = () => {
    my_video_container.classList.toggle('hide');
    hide_show.classList.toggle('fa-chevron-right');
    hide_show.classList.toggle('fa-chevron-left');
}



// functions related to webRTC connection

function createPeer(){

    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: 'turn:numb.viagenie.ca',
                credential: 'I1server',
                username: 'roarout20@gmail.com',
            },
            {urls:'stun:stun.l.google.com:19302'},
            {urls:'stun:stunserver.org'},
        ]
    });

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

    
    peer.ontrack = async (e) => {

        receivedStreamCount++;
        if (receivedStreamCount === 2){
            receivedStream = e.streams[0];
        }
    
        otherVideo.srcObject = e.streams[0];
    
    }

    peer.onicecandidate = (e) => {

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
    peer.ondatachannel = (e) => {
        console.log('in on data channel!!');
        console.log(e.channel);
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

    return peer;

}


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

const disable_chat = () => {
    msg_data.disabled = true;
    msg_send.disabled = true;
}

const enable_chat = () => {
    msg_data.disabled = false;
    msg_send.disabled = false;
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

const remove_guest_name_from_info = () => {
    const guestName = info_list.lastElementChild;
    info_list.removeChild(guestName);
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

const show_full_overlay_content_for_guest = (information) => {
  
    full_overlay_content.innerHTML = `${information}<br><br>Leave Room button will end the room!
                                        <button id="leave-room-btn" class="leave-room-btn">Leave Room</button>`;

    const leave_room_btn = document.getElementById('leave-room-btn');

    leave_room_btn.onclick = () => {
        var peer = get_relevant_peer();
        peer.dc.close();
        peer.close();
        socket.emit('room-left', {
            roomId: ROOM_ID
        });
        window.location.href = '/';
    } 

}


const show_full_overlay_content_for_host = (information) => {
        
    full_overlay_content.innerHTML = `${information}<button id="end-room-btn" class="end-room-btn">End Room</button>`;

    const end_room_btn = document.getElementById('end-room-btn');
    end_room_btn.onclick = () => {
        var peer = get_relevant_peer();

        peer.close();
        socket.emit('room-ended', {
            roomId: ROOM_ID
        });
        window.location.href = '/';
    }

}

const get_relevant_peer = () => {
    if (USER_TYPE === 'Host') return peerHost;
    return peerGuest;
}

const get_fullscreen_element = () => {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullscreenElement
        || document.msFullscreenElement
}

const toggle_fullscreen = () => {
    if(get_fullscreen_element()){
        document.exitFullscreen();
    }else {
        document.documentElement.requestFullscreen().catch(console.log);       
    }
}