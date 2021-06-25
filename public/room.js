const socket = io('/');

let guid = () => {
    let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

let USER_ID = guid();


window.onload = () => {
    init();
}


//send roomId and userId to backend connection
socket.emit('join-room', {
    roomId: ROOM_ID,
    userId: USER_ID
});


//downstream user media from server when new user when connected
socket.on('user-connected', async (data) => {
    await new Promise(r => setTimeout(r, 1000));
    if (data.userId !== USER_ID){
        console.log('Recieved the userId in the front end ' + data.userId);
        const peerRecieve = createPeer('/broadcast/viewbroadcastnew', data.userId);
        peerRecieve.addTransceiver('video', { direction: 'recvonly' });
        peerRecieve.ontrack = e => handleTrackEvent(e);
    }
});


//this function will run when someone enters the room
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
    

    console.log('My userId = ' + USER_ID);
    //upstream user media to the server
    const peerSend = createPeer('/broadcast', USER_ID);
    stream.getTracks().forEach(track => peerSend.addTrack(track, stream));
    requestForAlreadyExistingStreams();
}


async function requestForAlreadyExistingStreams(){
    const payload = {
        roomId: ROOM_ID
    }

    const { data } = await axios.post('/broadcast/getnumberofalreadyexistingbroadcasts', payload);
    
    const count = data.number_of_already_existing_broadcasts;

    for(let i = 0; i < count; i++){
        const peerRecieve = createPeer('/broadcast/viewbroadcastprevious', USER_ID);
        peerRecieve.addTransceiver('video', { direction: 'recvonly' });
        peerRecieve.ontrack = e => handleTrackEvent(e);
    }
    
}

//this function creates a connection with server, the purpose of the connection is specified by the url
function createPeer(url, userId){
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer, url, userId);

    return peer;
}

//function used in createPeer
async function handleNegotiationNeededEvent(peer, url, userId){
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const payload = {
        sdp: peer.localDescription,
        roomId: ROOM_ID,
        myUserId: USER_ID,
        userIdToReceiveFrom: userId,
    }

    const { data } = await axios.post(`${url}`, payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));

} 

//handles incoming user media
function handleTrackEvent(e){
    console.log('received something');
    const videoGrid = document.getElementById('video-grid');
    const broadcastVideo = document.createElement('video');
    broadcastVideo.srcObject = e.streams[0];
    broadcastVideo.play();
    videoGrid.appendChild(broadcastVideo);
}