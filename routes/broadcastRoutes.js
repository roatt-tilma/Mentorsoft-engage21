const express = require('express');
const broadcastController = require('../controllers/broadcastController');
const router = express.Router();

router.post('/', broadcastController.broadcast);
router.post('/viewbroadcastnew', broadcastController.view_broadcast_new);
router.post('/getnumberofalreadyexistingbroadcasts', broadcastController.get_number_of_already_existing_broadcasts);
router.post('/viewbroadcastprevious', broadcastController.view_broadcast_previous);

module.exports = router;