const express = require('express');
const roomController = require("../controllers/roomController");
const router = express.Router();

router.get('/', roomController.goto_room);
router.get('/:room', roomController.start_room);

module.exports = router;

