export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code: string;

    constructor(message: string, statusCode: number, code: string = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string>[];

    constructor(message: string = 'Validation failed', errors: Record<string, string>[] = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'FORBIDDEN');
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class TenantSuspendedError extends AppError {
    constructor() {
        super('Tenant account is suspended. Please update your subscription.', 403, 'TENANT_SUSPENDED');
    }
}
