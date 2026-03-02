import { Request } from 'express';
import { Types } from 'mongoose';

export interface IAuthUser {
    _id: Types.ObjectId;
    tenantId: string;
    email: string;
    roleId: Types.ObjectId;
    role?: {
        name: string;
        permissions: string[];
    };
}

export interface IAuthRequest extends Request {
    user?: IAuthUser;
    tenantId?: string;
}

export interface IApiResponse<T = any> {
    status: 'success' | 'error';
    data?: T;
    code?: string;
    message?: string;
    errors?: any[];
    pagination?: {
        nextCursor: string | null;
        hasMore: boolean;
    };
}
