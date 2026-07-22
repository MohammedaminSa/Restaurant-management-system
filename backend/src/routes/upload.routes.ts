import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '@middlewares/auth';
import { UserRole } from '@/interfaces/index';
import { ResponseHandler } from '@utils/responseHandler';

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post(
  '/upload',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.RESTAURANT_ADMIN),
  upload.single('image'),
  (req: Request, res: Response) => {
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return ResponseHandler.success(res, { url, filename: req.file.filename }, 'Image uploaded successfully');
  }
);

export default router;
