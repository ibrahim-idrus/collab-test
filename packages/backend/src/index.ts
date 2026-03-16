import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { timing } from "hono/timing";
import { usersRouter } from "./routes/users";
import { itemsRouter } from "./routes/items";
import { storageRouter } from "./routes/storage";
import { eq } from "drizzle-orm";
import { createDb } from "./db";
import { items } from "./db/schema";

// ─── App ──────────────────────────────────────────────────────────────────────

const app = new Hono<{ Bindings: Env }>();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(logger());
app.use(timing());
app.use(prettyJSON());

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.FRONTEND_URL || "http://localhost:5173";
      return origin === allowed ? origin : allowed;
    },
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.route("/api/users", usersRouter);
app.route("/api/items", itemsRouter);
app.route("/api/storage", storageRouter);

// ─── Queue Consumer ───────────────────────────────────────────────────────────

export default {
  /**
   * HTTP handler – forwards requests to the Hono app.
   */
  fetch: app.fetch,

  /**
   * Queue consumer – processes background tasks sent via TASK_QUEUE.
   */
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    const db = createDb(env.DATABASE_URL);

    for (const message of batch.messages) {
      try {
        const { type, payload } = message.body as {
          type: string;
          payload: Record<string, string>;
        };

        if (type === "INCREMENT_VIEW_COUNT") {
          const { itemId } = payload;
          const current = await db.query.items.findFirst({
            where: (i, { eq }) => eq(i.id, itemId),
          });
          if (current) {
            await db
              .update(items)
              .set({ viewCount: current.viewCount + 1, updatedAt: new Date() })
              .where(eq(items.id, itemId));
          }
        }

        message.ack();
      } catch (err) {
        console.error("Queue processing error:", err);
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<Env>;
