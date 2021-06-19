//const { v4: uuidV4 } = require('uuid');

const goto_broadcast = (req, res) => {
    res.redirect('room/myroom');
}

const view_broadcast = (req, res) => {
    res.render('room', { title: 'BROADCAST', roomId: req.params.broadcast, userId: 'mentee' })
}

module.exports = {
    goto_broadcast,
    view_broadcast
}