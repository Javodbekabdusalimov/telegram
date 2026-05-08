const crypto = require('crypto');

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

exports.getOTPExpiry = (minutes = 5) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
