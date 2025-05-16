const express = require('express');
const router = express.Router();
const advertController = require('../controllers/advertController');
const { authenticateToken, optionalAuthenticateToken } = require('./middleware/auth');

// Public routes
router.get('/', advertController.getAdverts);
router.get('/:id', advertController.getAdvertById);
router.post('/:id/view', advertController.trackAdvertView);
router.get('/:id/share', advertController.getShareableLink);
router.get('/:id/stats', optionalAuthenticateToken, advertController.getAdvertStats);
router.get('/:id/share-private', authenticateToken, advertController.getPrivateShareableLink);

// Protected routes
router.post('/', authenticateToken, advertController.createAdvert);
router.put('/:id', authenticateToken, advertController.updateAdvert);
router.delete('/:id', authenticateToken, advertController.deleteAdvert);
router.get('/user/me', authenticateToken, advertController.getUserAdverts);
router.post('/:id/upvote', authenticateToken, advertController.upvoteAdvert);

module.exports = router;