const express = require('express');
const router = express.Router();
const {
	createItem,
	getItems,
	getItemStats,
	searchItems,
	getItemsByCategory,
	getFoundTimelineOverview,
	getItemTimeline,
	getItemsByUser,
	updateItemTrackingStatus,
	updateItem,
	deleteItem,
} = require('../controllers/itemController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/search', searchItems);
router.post('/', protect, createItem);
router.get('/', getItems);
router.get('/stats/summary', getItemStats);
router.get('/found/timeline-overview', getFoundTimelineOverview);
router.get('/user/:userId', protect, getItemsByUser);
router.get('/:id/timeline', getItemTimeline);
router.patch('/:id/tracking-status', protect, updateItemTrackingStatus);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.get('/:category', getItemsByCategory);

module.exports = router;
