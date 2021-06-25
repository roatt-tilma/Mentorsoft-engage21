const User = require('../classes/UserClass');

const userData = new Map();

const setupUser = (roomId, userId) => {
    console.log('user Setup \nroomId: ' + roomId + '\nuserId: ' + userId);
    if (!userData.has(userId)){    
        const new_user = new User(roomId, userId);
        userData.set(userId, new_user);
    }
}

//set the upstream from user to the corresponding user object
const handleTrackEvent = (e, userId) => {
    console.log('handle track event userId: ' + userId);
    const user = userData.get(userId);
    user.userStream = e.streams[0];
}


//send broadcast of new user to the users who are already there in the room
const broadcastStreamNew = (myUserId, userIdToReceiveFrom, peer) => {
    console.log('broadcast stream new \nreceiverId: ' + myUserId + '\nsenderId: ' + userIdToReceiveFrom);
    const sender = userData.get(userIdToReceiveFrom);
    const stream = sender.userStream; 
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    const receiver = userData.get(myUserId);
    receiver.receivedFrom.add(userIdToReceiveFrom);
}


const getCount = (roomId) => {
    let count = 0;

    userData.forEach(element => {
        if(element.roomId === roomId){
            count++;
        }
    });

    return count;
}


const broadcastStreamPrevious = (myUserId, peer) => {

    console.log('broadcast stream previous \nreceiverId: ' + myUserId);

    const receiver = userData.get(myUserId);
    const alreadyReceived = receiver.receivedFrom;

    for (const [userId, data] of userData) {
        if(!alreadyReceived.has(userId) && data.roomId === receiver.roomId){
            console.log('senderId: ' + userId);
            data.userStream.getTracks().forEach(track => peer.addTrack(track, data.userStream));
            receiver.receivedFrom.add(userId);
            break;
        }
    }
}

module.exports = {
    setupUser,
    handleTrackEvent,
    broadcastStreamNew,
    getCount,
    broadcastStreamPrevious
}