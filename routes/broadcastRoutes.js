const express = require('express');
const broadcastController = require('../controllers/broadcastController');
const router = express.Router();

router.post('/', broadcastController.broadcast);
router.post('/viewbroadcast', broadcastController.view_broadcast);

module.exports = router;