const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
  ]);
  if (!allowed.has(file.mimetype)) {
    return cb(new AppError('Unsupported file type.', 400, 'INVALID_FILE'));
  }
  cb(null, true);
}

const maxMb = Number(process.env.MAX_UPLOAD_MB || 5);

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxMb * 1024 * 1024 },
});

module.exports = { upload, uploadDir };
