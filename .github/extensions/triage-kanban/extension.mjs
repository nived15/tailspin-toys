// Extension: triage-kanban
// A Kanban-style triage board for the repo's open GitHub issues.
//
// Wiring only: one loopback HTTP server per open canvas instance serves the
// board (render.mjs) and a small JSON endpoint. Issue data and the context
// message live in issues.mjs; the renderer lives in render.mjs.

import { createServer } from "node:http";
import { joinSession, createCanvas, CanvasError } from "@github/copilot-sdk/extension";
import { renderHtml } from "./render.mjs";
import { ISSUES, findIssue, buildContextMessage } from "./issues.mjs";

// Assigned once joinSession resolves; the request/action handlers below only
// ever run afterwards, so the reference is always populated by then.
let session;

// One ephemeral-port loopback server per instanceId so multiple opens don't
// collide on a port.
const servers = new Map();

/** Read and JSON-parse a request body (best effort, capped small). */
async function readJsonBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        size += chunk.length;
        if (size > 64 * 1024) throw new Error("Request body too large");
        chunks.push(chunk);
    }
    if (chunks.length === 0) return {};
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

/**
 * Inject a single issue into the current session as a new user turn so the
 * user can start working on it straight away. Returns the resolved issue.
 */
async function addIssueToContext(issueNumber) {
    const issue = findIssue(issueNumber);
    if (!issue) {
        throw new CanvasError("issue_not_found", `No triaged issue with number ${issueNumber}`);
    }
    if (!session) {
        throw new CanvasError("session_unavailable", "Session is not ready yet");
    }
    await session.send(buildContextMessage(issue));
    await session.log(`Added issue #${issue.number} ("${issue.title}") to the session context.`);
    return issue;
}

async function startServer(instanceId) {
    const server = createServer(async (req, res) => {
        try {
            if (req.method === "POST" && req.url === "/add-to-context") {
                const body = await readJsonBody(req);
                const issue = await addIssueToContext(Number(body.issue));
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ ok: true, issue: issue.number }));
                return;
            }
            if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(renderHtml());
                return;
            }
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: false, error: "not_found" }));
        } catch (err) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
        }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, url: `http://127.0.0.1:${port}/` };
}

session = await joinSession({
    canvases: [
        createCanvas({
            id: "triage-kanban",
            displayName: "Triage board",
            description:
                "Kanban triage board of the repo's open issues; top three are prioritised with justifications and each card can be added to the session context.",
            actions: [
                {
                    name: "add_issue_to_context",
                    description:
                        "Add a triaged GitHub issue to the current session as context so the user can start working on it.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            issueNumber: {
                                type: "number",
                                description: "The GitHub issue number to add to the session context.",
                            },
                        },
                        required: ["issueNumber"],
                    },
                    handler: async (ctx) => {
                        const issue = await addIssueToContext(Number(ctx.input?.issueNumber));
                        return { ok: true, issue: issue.number, title: issue.title };
                    },
                },
            ],
            open: async (ctx) => {
                let entry = servers.get(ctx.instanceId);
                if (!entry) {
                    entry = await startServer(ctx.instanceId);
                    servers.set(ctx.instanceId, entry);
                }
                return {
                    title: "Triage board",
                    status: `${ISSUES.length} open issues`,
                    url: entry.url,
                };
            },
            onClose: async (ctx) => {
                const entry = servers.get(ctx.instanceId);
                if (entry) {
                    servers.delete(ctx.instanceId);
                    await new Promise((resolve) => entry.server.close(() => resolve()));
                }
            },
        }),
    ],
});
