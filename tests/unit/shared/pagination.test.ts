import { Types } from 'mongoose';
import { parsePaginationQuery, buildPaginationResult } from '@shared/utils/pagination';

describe('parsePaginationQuery', () => {
    it('should return default limit of 20 when not specified', () => {
        const result = parsePaginationQuery({});
        expect(result.limit).toBe(20);
        expect(result.cursor).toBeUndefined();
    });

    it('should parse numeric limit', () => {
        const result = parsePaginationQuery({ limit: '50' });
        expect(result.limit).toBe(50);
    });

    it('should cap limit at 100', () => {
        const result = parsePaginationQuery({ limit: '500' });
        expect(result.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
        const result = parsePaginationQuery({ limit: '-5' });
        expect(result.limit).toBe(1);
    });

    it('should parse valid ObjectId cursor', () => {
        const id = new Types.ObjectId();
        const result = parsePaginationQuery({ cursor: id.toString() });
        expect(result.cursor).toEqual(id);
    });

    it('should ignore invalid cursor', () => {
        const result = parsePaginationQuery({ cursor: 'invalid' });
        expect(result.cursor).toBeUndefined();
    });
});

describe('buildPaginationResult', () => {
    const makeItem = () => ({ _id: new Types.ObjectId(), name: 'test' });

    it('should return hasMore=false when results <= limit', () => {
        const items = [makeItem(), makeItem()];
        const result = buildPaginationResult(items, 5);
        expect(result.data).toHaveLength(2);
        expect(result.pagination.hasMore).toBe(false);
        expect(result.pagination.nextCursor).toBeNull();
    });

    it('should return hasMore=true when results > limit', () => {
        const items = [makeItem(), makeItem(), makeItem()];
        const result = buildPaginationResult(items, 2);
        expect(result.data).toHaveLength(2);
        expect(result.pagination.hasMore).toBe(true);
        expect(result.pagination.nextCursor).toBe(items[1]._id.toString());
    });

    it('should handle empty results', () => {
        const result = buildPaginationResult([], 10);
        expect(result.data).toHaveLength(0);
        expect(result.pagination.hasMore).toBe(false);
        expect(result.pagination.nextCursor).toBeNull();
    });
});
