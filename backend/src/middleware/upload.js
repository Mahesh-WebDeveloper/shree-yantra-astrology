// Profile-pic upload — multer (disk storage).
// DEV/local: file backend/uploads/avatars/ me save hoti hai aur /uploads se serve hoti hai.
// PRODUCTION: yahan multer-s3 / cloudinary storage swap kar dena — baaki code same.
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const CONTENT_DIR = path.join(__dirname, '..', '..', 'uploads', 'content');
fs.mkdirSync(AVATAR_DIR, { recursive: true }); // dir nahi hai to bana do
fs.mkdirSync(CONTENT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const uid = req.user ? String(req.user._id) : 'anon';
    cb(null, `${uid}-${Date.now()}${ext}`);
  },
});

const contentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CONTENT_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const prefix = req.user ? String(req.user._id) : 'admin';
    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Sirf image (jpg/png/webp) allowed hai'), { status: 400 }));
}

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
}).single('avatar');

const uploadContentImage = multer({
  storage: contentStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]);

// multer ke errors ko clean JSON me badalne wala wrapper
function avatarUpload(req, res, next) {
  uploadAvatar(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image 5MB se chhoti honi chahiye' : err.message;
      return res.status(err.status || 400).json({ error: msg });
    }
    next();
  });
}

function contentImageUpload(req, res, next) {
  uploadContentImage(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image 5MB se chhoti honi chahiye' : err.message;
      return res.status(err.status || 400).json({ error: msg });
    }
    next();
  });
}

module.exports = { avatarUpload, contentImageUpload, AVATAR_DIR, CONTENT_DIR };
