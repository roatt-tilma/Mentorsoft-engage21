const express = require('express');
const roomController = require("../controllers/roomController");
const router = express.Router();

router.post('/', roomController.goto_room);
router.post('/connectGuest', roomController.connect_guest);

module.exports = router;

