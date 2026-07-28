// Triage data for the Kanban board canvas.
//
// The six open issues in nived15/tailspin-toys were all filed at the same time
// with no labels, assignees, or comments, so ranking is based on leverage:
// which work is foundational/blocking, which delivers the most user value, and
// which items overlap enough that they should be tackled together to avoid
// reworking the same code twice. The top three cluster around the game-list
// data-access layer; the remainder are more isolated and can follow.

export const REPO = "nived15/tailspin-toys";

/**
 * @typedef {Object} TriageIssue
 * @property {number} number      GitHub issue number.
 * @property {string} title       Issue title.
 * @property {string} url         Canonical GitHub issue URL.
 * @property {"top" | "backlog"} lane  Which board lane the card renders in.
 * @property {number} rank        1-based ordering within its lane.
 * @property {string} description Human summary of the issue's content.
 * @property {string} [justification] Why it sits at the top (top lane only).
 * @property {string} [effort]    Rough effort tag (backlog cards).
 * @property {string} [impact]    Rough impact tag (backlog cards).
 * @property {string} body        Full issue body, injected as session context.
 */

/** @type {TriageIssue[]} */
export const ISSUES = [
    {
        number: 6,
        title: "Implement pagination on the game list page",
        url: "https://github.com/nived15/tailspin-toys/issues/6",
        lane: "top",
        rank: 1,
        description:
            "The full catalog currently loads on a single page. This adds page/limit (or cursor) support to the src/lib/ data-access helpers plus accessible pagination controls on the game list, backed by Vitest and Playwright coverage.",
        justification:
            "Highest-leverage and foundational. It reshapes the same game-list data-access helpers that Search (#1) and Sort (#2) build on, so sequencing it first prevents reworking that layer twice and avoids merge conflicts across the three features. It also fixes a performance problem that only worsens as the catalog grows.",
        body: `As the number of games grows, loading the entire catalog on a single page hurts performance and makes the list harder to browse. Adding pagination keeps the game list page fast and manageable.

## Acceptance criteria

- [ ] The data-access helpers in \`src/lib/\` support pagination (for example page/limit or cursor-based)
- [ ] The game list page includes pagination controls
- [ ] Pagination controls follow the project's accessibility guidelines and include \`data-testid\` attributes
- [ ] Vitest unit tests cover the pagination helpers and Playwright e2e tests cover the pagination behavior`,
    },
    {
        number: 1,
        title: "Add a search box to find games by title",
        url: "https://github.com/nived15/tailspin-toys/issues/1",
        lane: "top",
        rank: 2,
        description:
            "Add a case-insensitive search box on the game list that filters by title, shows an empty state when nothing matches, and is backed by a data-layer helper with unit and e2e tests.",
        justification:
            "Biggest immediate user-facing win for discoverability on the core browsing page. The issue explicitly frames it as the base for the planned category and publisher filters, so landing it also unblocks that future work.",
        body: `Players who already know what they're looking for shouldn't have to scan the whole catalog. Adding a simple search box on the game list page lets users quickly narrow the list by title, improving discoverability alongside the planned category and publisher filters. This builds on the existing game list data layer without changing the data model.

## Acceptance criteria

- [ ] The game list page includes a search input that filters games by title
- [ ] Matching is case-insensitive and updates the visible list as the user types or submits
- [ ] An appropriate empty state is shown when no games match the search
- [ ] The search input follows the project's accessibility guidelines (labeling, keyboard navigation, visible focus states) and includes a \`data-testid\` attribute
- [ ] Unit tests cover any new data-layer/search helper and Playwright e2e tests cover the search behavior`,
    },
    {
        number: 2,
        title: "Allow users to sort the game list",
        url: "https://github.com/nived15/tailspin-toys/issues/2",
        lane: "top",
        rank: 3,
        description:
            "Let users sort the game list by title (A–Z / Z–A) and by star rating (highest first), with a documented ordering for unrated games and an accessible sort control, covered by unit and e2e tests.",
        justification:
            "Touches the very same game-list page and src/lib/ helpers as Pagination and Search. Folding it into the same work window keeps the list-page refactor coherent and avoids a third separate pass over that code.",
        body: `Different players browse in different ways — some want the highest-rated titles first, others prefer alphabetical order. Adding sorting options to the game list page gives backers more control over how they explore the catalog. The data layer already exposes title and star rating, so this builds on existing structures.

## Acceptance criteria

- [ ] Users can sort the game list by title (A–Z and Z–A)
- [ ] Users can sort the game list by star rating (highest first)
- [ ] Games without a star rating are ordered in a sensible, documented way when sorting by rating
- [ ] The sort control follows the project's accessibility guidelines (labeling, keyboard navigation, visible focus states) and includes a \`data-testid\` attribute
- [ ] Unit tests cover the sorting helper(s) and Playwright e2e tests cover the sorting behavior`,
    },
    {
        number: 3,
        title: "Show category and publisher descriptions on the game detail page",
        url: "https://github.com/nived15/tailspin-toys/issues/3",
        lane: "backlog",
        rank: 1,
        effort: "Low",
        impact: "Medium",
        description:
            "Surface the existing category and publisher description fields on the game detail page (hidden when absent). No schema changes — update the data helper and its tests. A quick, low-risk win.",
        body: `The categories and publishers tables already include a \`description\` field, but the game detail page only shows their names. Surfacing these descriptions gives backers helpful context about who is behind a game and what kind of game it is, with no schema changes required.

## Acceptance criteria

- [ ] The game detail page displays the category description when one is available
- [ ] The game detail page displays the publisher description when one is available
- [ ] Missing descriptions are handled gracefully (the section is hidden rather than showing empty content)
- [ ] The new content follows the project's styling and accessibility guidelines and includes \`data-testid\` attributes
- [ ] The data-access helper is updated to include the description fields, with unit tests covering the change, and Playwright e2e tests verify the descriptions render`,
    },
    {
        number: 5,
        title: "Show a catalog summary on the home page",
        url: "https://github.com/nived15/tailspin-toys/issues/5",
        lane: "backlog",
        rank: 2,
        effort: "Low",
        impact: "Medium",
        description:
            "Show total game count and average star rating on the home page, handling the no-games / no-ratings edge cases, via a deterministic helper with unit and e2e coverage.",
        body: `The home page jumps straight into the featured games grid without giving visitors a sense of the catalog's size or quality. Adding a small summary — such as the total number of games and the average star rating — gives backers useful at-a-glance context and makes the landing page feel more alive. This builds entirely on data already available in the data layer.

## Acceptance criteria

- [ ] The home page displays the total number of games in the catalog
- [ ] The home page displays the average star rating across games that have a rating
- [ ] The summary handles edge cases gracefully (no games, or no rated games)
- [ ] The summary follows the project's styling and accessibility guidelines and includes \`data-testid\` attributes
- [ ] A data-access helper computes the summary deterministically, with unit test coverage, and Playwright e2e tests verify it renders on the home page`,
    },
    {
        number: 4,
        title: "Add a publisher page listing that publisher's games",
        url: "https://github.com/nived15/tailspin-toys/issues/4",
        lane: "backlog",
        rank: 3,
        effort: "Medium",
        impact: "Medium",
        description:
            "Add a prerendered per-publisher page (getStaticPaths + prerender) listing that publisher's games, linked from cards / detail pages and reusing the existing game card. Larger scope than the other backlog items.",
        body: `When a backer likes a game, a natural next step is to see what else the same publisher has made. Adding a dedicated, prerendered page for each publisher that lists their games improves catalog navigation. The data model already links games to publishers, so this is a focused addition that follows the existing dynamic-route pattern used for game detail pages.

## Acceptance criteria

- [ ] Each publisher has a prerendered page (using \`getStaticPaths()\` + \`export const prerender = true\`) listing all of their games
- [ ] The page shows the publisher name and description, and reuses the existing game card for the listing
- [ ] Publisher names on the game card and/or game detail page link to the publisher page
- [ ] The page follows the project's styling and accessibility guidelines and includes \`data-testid\` attributes
- [ ] A data-access helper returns games for a given publisher with unit test coverage, and Playwright e2e tests cover the publisher page`,
    },
];

/** Look up a single issue by its GitHub number. */
export function findIssue(number) {
    return ISSUES.find((issue) => issue.number === number);
}

/**
 * Build the message injected into the session when a card is added to context.
 * Includes the full issue body so the agent can start work with real detail.
 */
export function buildContextMessage(issue) {
    return `Let's start working on GitHub issue #${issue.number}: "${issue.title}".
${issue.url}

Full issue for context:
---
${issue.body}
---

Please treat this issue as the current focus for this session. First review the relevant code (the \`src/lib/\` data-access helpers, the affected Astro pages/components, and the existing tests), then propose a short implementation plan before making changes. Follow the repository's Copilot instructions, and run tests and lint through the quality-checks skill.`;
}
