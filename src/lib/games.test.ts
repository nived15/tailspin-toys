import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getGameFilterOptions,
    getAllGameIds,
    getGameById,
    getGamesByFilters,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

interface FilterFixture {
    categoryIds: {
        strategy: number;
        party: number;
        puzzle: number;
    };
    publisherIds: {
        pubOne: number;
        pubTwo: number;
    };
}

async function seedFilterFixture(db: Database): Promise<FilterFixture> {
    const [strategy] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [party] = await db
        .insert(categories)
        .values({ name: 'Party', description: 'cat' })
        .returning({ id: categories.id });
    const [puzzle] = await db
        .insert(categories)
        .values({ name: 'Puzzle', description: 'cat' })
        .returning({ id: categories.id });
    const [pubOne] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });
    const [pubTwo] = await db
        .insert(publishers)
        .values({ name: 'Pub Two', description: 'pub' })
        .returning({ id: publishers.id });

    await db.insert(games).values([
        {
            title: 'Alpha Assault',
            description: 'desc',
            starRating: 4.4,
            categoryId: strategy.id,
            publisherId: pubOne.id,
        },
        {
            title: 'Beta Builders',
            description: 'desc',
            starRating: 4.1,
            categoryId: strategy.id,
            publisherId: pubTwo.id,
        },
        {
            title: 'Gamma Gala',
            description: 'desc',
            starRating: 4.3,
            categoryId: party.id,
            publisherId: pubOne.id,
        },
        {
            title: 'Delta Drift',
            description: 'desc',
            starRating: 4.0,
            categoryId: party.id,
            publisherId: pubTwo.id,
        },
        {
            title: 'Epsilon Escape',
            description: 'desc',
            starRating: 4.7,
            categoryId: puzzle.id,
            publisherId: pubTwo.id,
        },
    ]);

    return {
        categoryIds: {
            strategy: strategy.id,
            party: party.id,
            puzzle: puzzle.id,
        },
        publisherIds: {
            pubOne: pubOne.id,
            pubTwo: pubTwo.id,
        },
    };
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('returns games for one or more categories', async () => {
        const fixture = await seedFilterFixture(db);
        const strategyOnly = await getGamesByFilters(db, { categoryIds: [fixture.categoryIds.strategy] });
        const multiCategory = await getGamesByFilters(db, {
            categoryIds: [fixture.categoryIds.party, fixture.categoryIds.puzzle],
        });

        expect(strategyOnly.map((game) => game.title)).toEqual(['Alpha Assault', 'Beta Builders']);
        expect(multiCategory.map((game) => game.title)).toEqual([
            'Delta Drift',
            'Epsilon Escape',
            'Gamma Gala',
        ]);
    });

    it('returns games for a selected publisher', async () => {
        const fixture = await seedFilterFixture(db);
        const byPublisher = await getGamesByFilters(db, { publisherId: fixture.publisherIds.pubOne });
        expect(byPublisher.map((game) => game.title)).toEqual(['Alpha Assault', 'Gamma Gala']);
    });

    it('combines category and publisher filters', async () => {
        const fixture = await seedFilterFixture(db);
        const combined = await getGamesByFilters(db, {
            categoryIds: [fixture.categoryIds.party],
            publisherId: fixture.publisherIds.pubOne,
        });
        expect(combined.map((game) => game.title)).toEqual(['Gamma Gala']);
    });

    it('returns an empty list when filters have no matches', async () => {
        const fixture = await seedFilterFixture(db);
        const noResults = await getGamesByFilters(db, {
            categoryIds: [fixture.categoryIds.strategy],
            publisherId: 99999,
        });
        expect(noResults).toEqual([]);
    });

    it('returns sorted category and publisher options for filters', async () => {
        await seedFilterFixture(db);
        const options = await getGameFilterOptions(db);
        expect(options.categories.map((category) => category.name)).toEqual(['Party', 'Puzzle', 'Strategy']);
        expect(options.publishers.map((publisher) => publisher.name)).toEqual(['Pub One', 'Pub Two']);
    });
});
