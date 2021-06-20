class User{
    constructor(roomId, userId){
        this.roomId = roomId;
        this.userId = userId;
        this.userStream = null;
        this.peersForDownStream = new Set();
        this.name = 'Guest';
    }
}

module.exports = User;