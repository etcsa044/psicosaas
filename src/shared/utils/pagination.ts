import { Types } from 'mongoose';

export interface PaginationQuery {
    cursor?: string;
    limit?: number;
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        nextCursor: string | null;
        hasMore: boolean;
    };
}

export function parsePaginationQuery(query: any): { cursor?: Types.ObjectId; limit: number } {
    const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100);
    const cursor = query.cursor && Types.ObjectId.isValid(query.cursor)
        ? new Types.ObjectId(query.cursor)
        : undefined;
    return { cursor, limit };
}

export function buildPaginationResult<T extends { _id: any }>(
    results: T[],
    limit: number
): PaginationResult<T> {
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore && data.length > 0
        ? data[data.length - 1]._id.toString()
        : null;

    return { data, pagination: { nextCursor, hasMore } };
}
