const socket = io('/');
const videoGrid = document.getElementById('video-grid');

const myVideo = document.createElement('video');
myVideo.muted = true;

//to get video or audio from user, done by browser
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream);
   
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    })

})

socket.on('user-connected', userId => {
    console.log('User Connected ' + userId);
})

function addVideoStream(video, stream){
    video.srcObject = stream;
    video.play();
    videoGrid.append(video);
}