const express = require('express');
const roomController = require("../controllers/roomController");
const router = express.Router();

router.post('/', roomController.create_room);
router.post('/connect', roomController.connect_guest);

module.exports = router;

