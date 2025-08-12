const { auth, db } = require('../config/firebase');
const { getAccessToken, getProfileData } = require('../services/linkedinService');
const jwt = require('jsonwebtoken');

// ✅ Signup
const signupUser = async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const userRecord = await auth.createUser({ email, password, displayName: fullName });
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      fullName,
      createdAt: new Date().toISOString(),
    });

    const token = jwt.sign({ uid: userRecord.uid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user: { uid: userRecord.uid, email, fullName } });
  } catch (error) {
    let message = 'Signup failed';
    if (error.code === 'auth/email-already-exists') {
      message = 'Email already in use';
    }
    return res.status(500).json({ message });
  }
};

// ✅ Get All Users
const getAllUsers = async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => doc.data());

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching users", error });
  }
};

// ✅ Send OTP
const sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.collection('otps').doc(email).set({
      otp,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    console.log(`OTP for ${email}: ${otp}`);
    res.status(200).json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// ✅ Verify OTP
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const otpDoc = await db.collection('otps').doc(email).get();
    if (!otpDoc.exists || otpDoc.data().otp !== otp || otpDoc.data().expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    let userRecord = await auth.getUserByEmail(email).catch(() => null);
    if (!userRecord) {
      userRecord = await auth.createUser({ email });
    }

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      createdAt: new Date().toISOString(),
    });

    const token = jwt.sign({ uid: userRecord.uid }, process.env.JWT_SECRET);
    res.status(200).json({ token, user: { email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

// ✅ Google Login
const googleLogin = async (req, res) => {
  const { token } = req.body;
  try {
    const decoded = await auth.verifyIdToken(token);

    await db.collection('users').doc(decoded.uid).set({
      uid: decoded.uid,
      email: decoded.email,
      fullName: decoded.name || '',
      provider: 'google',
      createdAt: new Date().toISOString(),
    });

    const jwtToken = jwt.sign({ uid: decoded.uid }, process.env.JWT_SECRET);
    res.status(200).json({ token: jwtToken, user: { email: decoded.email } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
};

// ✅ LinkedIn Login
const linkedinCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const accessToken = await getAccessToken(code);
    const profileData = await getProfileData(accessToken);

    let userRecord = await auth.getUserByEmail(profileData.email).catch(() => null);
    if (!userRecord) {
      userRecord = await auth.createUser({ email: profileData.email });
    }

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: profileData.email,
      fullName: profileData.fullName || '',
      linkedInData: profileData,
      provider: 'linkedin',
      createdAt: new Date().toISOString(),
    });

    const token = jwt.sign({ uid: userRecord.uid }, process.env.JWT_SECRET);
    res.redirect(`/login?token=${token}`);
  } catch (err) {
    res.status(500).json({ error: 'LinkedIn login failed' });
  }
};

// ✅ Get LinkedIn Data
const getLinkedInData = async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    res.status(200).json(doc.data().linkedInData || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch LinkedIn data' });
  }
};

// ✅ Get Profile
const getUserProfile = async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(doc.data());
  } catch (err) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

// ✅ Update Profile
const updateUserProfile = async (req, res) => {
  const { fullName } = req.body;
  try {
    await db.collection('users').doc(req.user.uid).update({ fullName });
    res.status(200).json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ✅ Change Password
const changePassword = async (req, res) => {
  const { newPassword } = req.body;
  try {
    await auth.updateUser(req.user.uid, { password: newPassword });
    res.status(200).json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// ✅ Delete Account
const deleteUserAccount = async (req, res) => {
  try {
    await auth.deleteUser(req.user.uid);
    await db.collection('users').doc(req.user.uid).delete();
    res.status(200).json({ message: 'User account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// ✅ Logout
const logoutUser = async (req, res) => {
  res.status(200).json({ message: 'Logout successful (client should delete token)' });
};

module.exports = {
  signupUser,
  getAllUsers, // <-- नया जोड़ा
  sendOTP,
  verifyOTP,
  googleLogin,
  linkedinCallback,
  getLinkedInData,
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
  logoutUser,
};
