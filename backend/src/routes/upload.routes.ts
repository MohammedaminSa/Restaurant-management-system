import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate, authorize } from '@middlewares/auth';
import { UserRole } from '@/interfaces/index';
import { ResponseHandler } from '@utils/responseHandler';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
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
  (req: Request, res: Response, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return ResponseHandler.error(res, 'File size exceeds 5MB limit', 400);
          }
          return ResponseHandler.error(res, err.message, 400);
        }
        return ResponseHandler.error(res, err.message, 400);
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    if (!req.file) {
      return ResponseHandler.error(res, 'No file uploaded', 400);
    }

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'menu-items',
            transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
            timeout: 120000,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file!.buffer);
      });

      return ResponseHandler.success(
        res,
        { url: result.secure_url, filename: result.public_id },
        'Image uploaded successfully'
      );
    } catch (error: any) {
      return ResponseHandler.error(
        res,
        error.message || 'Failed to upload image to Cloudinary',
        500
      );
    }
  }
);

export default router;
