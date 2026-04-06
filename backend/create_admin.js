const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://admin:Lmo8bTyNzwvb0a8v@cluster0.to7png3.mongodb.net/lost_and_found?retryWrites=true&w=majority';

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    let admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin',
        itNumber: 'ADMIN001',
        email: 'admin@gmail.com',
        password: 'admin123',
        isAdmin: true
      });
      console.log('Admin account created successfully');
    } else {
      admin.isAdmin = true;
      admin.password = 'admin123'; // Reset to make sure it matches
      await admin.save();
      console.log('Admin account updated successfully');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
