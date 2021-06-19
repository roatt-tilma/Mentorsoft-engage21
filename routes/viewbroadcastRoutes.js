const express = require('express');
const viewbraodcastController = require('../controllers/viewbroadcastController');
const router = express.Router();

router.get('/', viewbraodcastController.goto_broadcast);
router.get('/:broadcast', viewbraodcastController.view_broadcast);

module.exports = router;