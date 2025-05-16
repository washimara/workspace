const express = require('express');
const router = express.Router();
const advertController = require('../controllers/advertController');
const { authenticateToken, optionalAuthenticateToken } = require('./middleware/auth');

// Add a console log to confirm the route is being registered
console.log('Registering advert routes...');

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

// Add this log to specifically highlight the upvote route
console.log('Registering upvote route: POST /:id/upvote');
router.post('/:id/upvote', authenticateToken, advertController.upvoteAdvert);

module.exports = router;