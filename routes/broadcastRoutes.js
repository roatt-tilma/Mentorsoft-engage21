const express = require('express');
const broadcastController = require('../controllers/broadcastController');
const router = express.Router();

router.post('/', broadcastController.broadcast);


module.exports = router;