import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@/interfaces/index';

export class ResponseHandler {
  static success<T>(res: Response, data?: T, message?: string, statusCode = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, error: string, statusCode = 500) {
    const response: ApiResponse = {
      success: false,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static badRequest(res: Response, error = 'Bad request') {
    return this.error(res, error, 400);
  }

  static unauthorized(res: Response, error = 'Unauthorized') {
    return this.error(res, error, 401);
  }

  static forbidden(res: Response, error = 'Forbidden') {
    return this.error(res, error, 403);
  }

  static notFound(res: Response, error = 'Resource not found') {
    return this.error(res, error, 404);
  }

  static conflict(res: Response, error = 'Conflict') {
    return this.error(res, error, 409);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    pageSize: number,
    totalItems: number
  ) {
    const totalPages = Math.ceil(totalItems / pageSize);
    
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    };
    
    return res.status(200).json(response);
  }
}
