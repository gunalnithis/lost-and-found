const express = require('express');
const router = express.Router();
const {
	registerUser,
	loginUser,
	socialLoginUser,
	getUsers,
	updateUserProfile,
	updateUserById,
	deleteUserById,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/social-login', socialLoginUser);
router.get('/', getUsers);
router.put('/profile', protect, updateUserProfile);
router.put('/:id', updateUserById);
router.delete('/:id', deleteUserById);



module.exports = router;
