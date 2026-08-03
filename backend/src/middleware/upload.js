// Profile-pic upload — multer (disk storage).
// DEV/local: file backend/uploads/avatars/ me save hoti hai aur /uploads se serve hoti hai.
// PRODUCTION: yahan multer-s3 / cloudinary storage swap kar dena — baaki code same.
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const CONTENT_DIR = path.join(__dirname, '..', '..', 'uploads', 'content');
const AUDIO_DIR = path.join(__dirname, '..', '..', 'uploads', 'audio', 'admin');
const VIDEO_DIR = path.join(__dirname, '..', '..', 'uploads', 'video', 'admin');
fs.mkdirSync(AVATAR_DIR, { recursive: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(VIDEO_DIR, { recursive: true });

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ALLOWED_AUDIO = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/aac',
  'audio/mp4', 'audio/x-m4a', 'audio/webm', 'audio/flac',
];
const ALLOWED_VIDEO = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg',
];

function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Sirf image (jpg/png/webp) allowed hai'), { status: 400 }));
}

function mediaFileFilter(req, file, cb) {
  const field = file.fieldname;
  if (field === 'image' || field === 'coverImage') {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    return cb(Object.assign(new Error('Thumbnail: sirf image (jpg/png/webp) allowed hai'), { status: 400 }));
  }
  if (field === 'audioFile') {
    if (ALLOWED_AUDIO.includes(file.mimetype) || /^audio\//.test(file.mimetype)) return cb(null, true);
    return cb(Object.assign(new Error('Audio: mp3, wav, ogg, m4a, webm allowed hai'), { status: 400 }));
  }
  if (field === 'videoFile') {
    if (ALLOWED_VIDEO.includes(file.mimetype) || /^video\//.test(file.mimetype)) return cb(null, true);
    return cb(Object.assign(new Error('Video: mp4, webm, mov allowed hai'), { status: 400 }));
  }
  cb(Object.assign(new Error('Invalid upload field'), { status: 400 }));
}

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

const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audioFile') return cb(null, AUDIO_DIR);
    if (file.fieldname === 'videoFile') return cb(null, VIDEO_DIR);
    cb(null, CONTENT_DIR);
  },
  filename: (req, file, cb) => {
    const fallbackExt = file.fieldname === 'audioFile' ? '.mp3' : file.fieldname === 'videoFile' ? '.mp4' : '.jpg';
    const ext = (path.extname(file.originalname) || fallbackExt).toLowerCase();
    const prefix = req.user ? String(req.user._id) : 'admin';
    cb(null, `${prefix}-${Date.now()}${ext}`);
  },
});

const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('avatar');

const uploadContentImage = multer({
  storage: contentStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([{ name: 'image', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]);

const uploadContentMedia = multer({
  storage: mediaStorage,
  fileFilter: mediaFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 },
  { name: 'videoFile', maxCount: 1 },
]);

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

function contentMediaUpload(req, res, next) {
  uploadContentMedia(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File 100MB se chhoti honi chahiye' : err.message;
      return res.status(err.status || 400).json({ error: msg });
    }
    next();
  });
}

module.exports = {
  avatarUpload,
  contentImageUpload,
  contentMediaUpload,
  AVATAR_DIR,
  CONTENT_DIR,
  AUDIO_DIR,
  VIDEO_DIR,
};
