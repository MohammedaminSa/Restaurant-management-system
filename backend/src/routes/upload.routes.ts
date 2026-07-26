import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '@middlewares/auth';
import { UserRole } from '@/interfaces/index';
import { ResponseHandler } from '@utils/responseHandler';

const uploadsDir = path.join(__dirname, '../../uploads/menu-items');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, jpeg, png, webp, and gif files are allowed'));
    }
  },
});

const router = Router();

router.post(
  '/upload',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  upload.single('image'),
  (req: Request, res: Response) => {
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}/uploads/menu-items/${req.file.filename}`;
    return ResponseHandler.success(
      res,
      { url, filename: req.file.filename },
      'Image uploaded successfully'
    );
  }
);

export default router;
