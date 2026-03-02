import { Response } from 'express';

interface PaginationMeta {
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({
        status: 'success',
        data,
    });
}

export function sendCreated<T>(res: Response, data: T): void {
    sendSuccess(res, data, 201);
}

export function sendPaginated<T>(res: Response, data: T[], pagination: PaginationMeta): void {
    res.status(200).json({
        status: 'success',
        data,
        pagination,
    });
}

export function sendError(res: Response, message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', errors?: any[]): void {
    res.status(statusCode).json({
        status: 'error',
        code,
        message,
        ...(errors && { errors }),
    });
}

export function sendNoContent(res: Response): void {
    res.status(204).send();
}
