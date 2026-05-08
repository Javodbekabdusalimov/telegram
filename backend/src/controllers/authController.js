const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { generateOTP, hashOTP, getOTPExpiry } = require('../utils/otp');

exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const otpExpiry = getOTPExpiry(5);

    await User.findOneAndUpdate(
      { phone },
      { otp: hashedOTP, otpExpiry },
      { upsert: true, new: true }
    );

    // In production, send via SMS. For demo, return OTP in response.
    console.log(`OTP for ${phone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp, firstName, lastName } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });

    const user = await User.findOne({ phone }).select('+otp +otpExpiry +refreshTokens');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP not requested' });
    }

    if (new Date() > user.otpExpiry) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const hashedOTP = hashOTP(otp);
    if (hashedOTP !== user.otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    const isNewUser = !user.isVerified;

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.isVerified = true;
    if (isNewUser && firstName) {
      user.firstName = firstName;
      user.lastName = lastName || '';
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    await user.save();

    res.json({
      success: true,
      isNewUser,
      accessToken,
      refreshToken,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id);
    user.refreshTokens = user.refreshTokens
      .filter((t) => t !== refreshToken)
      .concat(tokens.refreshToken)
      .slice(-5);
    await user.save();

    res.json({ success: true, ...tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: refreshToken },
        isOnline: false,
        lastSeen: new Date(),
      });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toPublicJSON() });
};
