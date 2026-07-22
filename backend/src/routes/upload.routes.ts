import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticate, authorize } from '@middlewares/auth';
import { UserRole } from '@/interfaces/index';
import { ResponseHandler } from '@utils/responseHandler';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'menu-items',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
  } as any,
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
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
    const file = req.file as any;
    return ResponseHandler.success(
      res,
      { url: file.path, filename: file.filename },
      'Image uploaded successfully'
    );
  }
);

export default router;
