const { v4: uuidV4 } = require('uuid');

const goto_room = (req, res) => {
    res.redirect(`room/${uuidV4()}`);
}

const start_room = (req, res) => {
    console.log('This is the room Id being generated ' + req.params.room);
    res.render('room', { title: "ROOM", roomId: req.params.room});
}

module.exports = {
    start_room,
    goto_room,
}