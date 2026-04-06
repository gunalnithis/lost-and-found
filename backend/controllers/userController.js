const jwt = require('jsonwebtoken');
const User = require('../models/User');

const normalizeUserType = (value) => {
  const allowed = ['student', 'lecture', 'others'];
  const normalized = String(value || 'others').trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : 'others';
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
  const { name, itNumber, email, password, phone, userType } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { itNumber }] });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      itNumber,
      email,
      password, // Note: In a real app, hash this!
      phone,
      userType: normalizeUserType(userType),
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        itNumber: user.itNumber,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        profilePic: user.profilePic,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const includeTotal = req.query.includeTotal === 'true';

    const [users, totalUsers] = await Promise.all([
      User.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean(),
      includeTotal ? User.countDocuments({}) : Promise.resolve(null),
    ]);

    if (includeTotal && totalUsers !== null) {
      res.set('X-Total-Count', String(totalUsers));
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.password === password) { // Note: In a real app, compare hashed passwords!
      const token = generateToken(user);
      res.json({
        _id: user._id,
        name: user.name,
        itNumber: user.itNumber,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        profilePic: user.profilePic,
        isAdmin: user.isAdmin,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Social login (Google / Facebook)
// @route   POST /api/users/social-login
// @access  Public
const socialLoginUser = async (req, res) => {
  const { email, name, provider, profilePic } = req.body;

  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const providerName = String(provider || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email is required for social login' });
    }

    if (!['google', 'facebook'].includes(providerName)) {
      return res.status(400).json({ message: 'Unsupported social provider' });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const fallbackName = String(name || 'Social User').trim();
      const generatedItNumber = `SOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      user = await User.create({
        name: fallbackName,
        itNumber: generatedItNumber,
        email: normalizedEmail,
        password: `SOCIAL_AUTH_${providerName.toUpperCase()}`,
        userType: 'others',
        profilePic: profilePic || '',
      });
    }

    const token = generateToken(user);

    return res.json({
      _id: user._id,
      name: user.name,
      itNumber: user.itNumber,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      profilePic: user.profilePic,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Public (Should be private in a real app)
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.itNumber = req.body.itNumber || user.itNumber;
      user.profilePic = req.body.profilePic || user.profilePic;
      if (req.body.userType) {
        user.userType = normalizeUserType(req.body.userType);
      }
      
      if (req.body.password) {
        user.password = req.body.password; // Note: In a real app, hash this!
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        itNumber: updatedUser.itNumber,
        email: updatedUser.email,
        phone: updatedUser.phone,
        userType: updatedUser.userType,
        profilePic: updatedUser.profilePic,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update any user by id (admin management)
// @route   PUT /api/users/:id
// @access  Public (recommended: admin only)
const updateUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.itNumber = req.body.itNumber || user.itNumber;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    if (req.body.userType) {
      user.userType = normalizeUserType(req.body.userType);
    }

    const updatedUser = await user.save();

    return res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      itNumber: updatedUser.itNumber,
      email: updatedUser.email,
      phone: updatedUser.phone,
      userType: updatedUser.userType,
      profilePic: updatedUser.profilePic,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user by id (admin management)
// @route   DELETE /api/users/:id
// @access  Public (recommended: admin only)
const deleteUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  socialLoginUser,
  getUsers,
  updateUserProfile,
  updateUserById,
  deleteUserById,
};


