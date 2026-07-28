import { and, asc, eq, inArray, type SQL } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Category, Game, Publisher } from '../types/game';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Returns all games ordered by title.
 * @param db - Injectable database client used by pages (real SQLite) and tests (in-memory libSQL).
 * @returns A title-ordered list of games including category and publisher summaries.
 */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Returns all game ids ordered by title.
 * @param db - Injectable database client used by pages (real SQLite) and tests (in-memory libSQL).
 * @returns A title-ordered list of game ids.
 */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/**
 * Returns one game for a provided id.
 * @param db - Injectable database client used by pages (real SQLite) and tests (in-memory libSQL).
 * @param id - Game id to look up.
 * @returns The matching game when found; otherwise `null`.
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const rows = await baseGamesQuery(db).where(eq(games.id, id)).limit(1);
    return rows.length > 0 ? mapGame(rows[0]) : null;
}

export interface GameFilters {
    categoryIds?: number[];
    publisherId?: number;
}

export interface GameFilterOptions {
    categories: Category[];
    publishers: Publisher[];
}

/**
 * Returns games filtered by category and/or publisher, ordered by title.
 * @param db - Injectable database client used by pages (real SQLite) and tests (in-memory libSQL).
 * @param filters - Optional category and publisher criteria to apply together.
 * @returns A title-ordered list of games matching the supplied filters.
 */
export async function getGamesByFilters(db: Database, filters: GameFilters): Promise<Game[]> {
    const conditions: SQL[] = [];
    if (Array.isArray(filters.categoryIds) && filters.categoryIds.length > 0) {
        conditions.push(inArray(games.categoryId, filters.categoryIds));
    }
    if (filters.publisherId !== undefined) {
        conditions.push(eq(games.publisherId, filters.publisherId));
    }

    const query = baseGamesQuery(db);
    const filteredQuery =
        conditions.length === 0
            ? query
            : conditions.length === 1
                ? query.where(conditions[0])
                : query.where(and(...conditions));

    const rows = await filteredQuery.orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Returns available category and publisher filter options ordered by name.
 * @param db - Injectable database client used by pages (real SQLite) and tests (in-memory libSQL).
 * @returns Distinct filter option lists for categories and publishers.
 */
export async function getGameFilterOptions(db: Database): Promise<GameFilterOptions> {
    const [categoryRows, publisherRows] = await Promise.all([
        db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)),
        db.select({ id: publishers.id, name: publishers.name }).from(publishers).orderBy(asc(publishers.name)),
    ]);

    return {
        categories: categoryRows,
        publishers: publisherRows,
    };
}
