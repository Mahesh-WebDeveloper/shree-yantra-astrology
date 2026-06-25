const path = require('path');
const fs = require('fs');
const asyncHandler = require('../middleware/asyncHandler');
const { AVATAR_DIR } = require('../middleware/upload');

// GET /api/profile  (protected) — current user ki profile + interests
exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toPublic() });
});

// purani avatar file delete (disk space waste na ho)
function removeOldAvatar(rel) {
  if (!rel) return;
  const file = path.join(AVATAR_DIR, path.basename(rel));
  fs.unlink(file, () => {}); // best-effort, error ignore
}

// POST /api/profile/avatar  (protected, multipart field 'avatar')
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Koi image nahi mili (field name: avatar)' });
  const user = req.user;
  const old = user.profile && user.profile.avatar;
  user.profile = user.profile || {};
  user.profile.avatar = `/uploads/avatars/${req.file.filename}`;
  user.markModified('profile');
  await user.save();
  if (old && old !== user.profile.avatar) removeOldAvatar(old);
  res.json({ user: user.toPublic(), avatar: user.profile.avatar });
});

// DELETE /api/profile/avatar  (protected)
exports.removeAvatar = asyncHandler(async (req, res) => {
  const user = req.user;
  const old = user.profile && user.profile.avatar;
  if (old) {
    removeOldAvatar(old);
    user.profile.avatar = undefined;
    user.markModified('profile');
    await user.save();
  }
  res.json({ user: user.toPublic() });
});

// PUT /api/profile  (protected)
// { name?, interests?, profile:{ dob, tob, tz, place, lat, lng, gender } }
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, interests, profile } = req.body;
  const user = req.user;

  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (Array.isArray(interests)) user.interests = interests;
  if (profile && typeof profile === 'object') {
    const allowed = ['dob', 'tob', 'tz', 'place', 'lat', 'lng', 'gender'];
    user.profile = user.profile || {};
    for (const k of allowed) {
      if (profile[k] !== undefined) user.profile[k] = profile[k];
    }
    user.markModified('profile');
  }

  await user.save();
  res.json({ user: user.toPublic() });
});
