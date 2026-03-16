import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { items, type NewItem } from "../db/schema";

const createItemSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  authorId: z.string().uuid(),
});

const updateItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export const itemsRouter = new Hono<{ Bindings: Env }>()
  // GET /items - list all items
  .get("/", async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const allItems = await db.query.items.findMany({
      with: { author: true },
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    });
    return c.json({ data: allItems });
  })

  // GET /items/:id - get item by ID
  .get("/:id", async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const item = await db.query.items.findFirst({
      where: (i, { eq }) => eq(i.id, c.req.param("id")),
      with: { author: true },
    });

    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    // Increment view count via queue (fire-and-forget)
    await c.env.TASK_QUEUE.send({
      type: "INCREMENT_VIEW_COUNT",
      payload: { itemId: item.id },
    });

    return c.json({ data: item });
  })

  // POST /items - create item
  .post("/", zValidator("json", createItemSchema), async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DATABASE_URL);

    const [newItem] = await db
      .insert(items)
      .values(body as NewItem)
      .returning();

    return c.json({ data: newItem }, 201);
  })

  // PATCH /items/:id - update item
  .patch("/:id", zValidator("json", updateItemSchema), async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DATABASE_URL);

    const [updated] = await db
      .update(items)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(items.id, c.req.param("id")))
      .returning();

    if (!updated) {
      return c.json({ error: "Item not found" }, 404);
    }
    return c.json({ data: updated });
  })

  // DELETE /items/:id - delete item
  .delete("/:id", async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const item = await db.query.items.findFirst({
      where: (i, { eq }) => eq(i.id, c.req.param("id")),
    });

    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    // Delete associated R2 object if present
    if (item.storageKey) {
      await c.env.STORAGE.delete(item.storageKey);
    }

    await db.delete(items).where(eq(items.id, c.req.param("id")));

    return c.json({ data: { id: c.req.param("id") } });
  })

  // POST /items/:id/upload - upload a file to R2 and attach to item
  .post("/:id/upload", async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const item = await db.query.items.findFirst({
      where: (i, { eq }) => eq(i.id, c.req.param("id")),
    });

    if (!item) {
      return c.json({ error: "Item not found" }, 404);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    const key = `items/${item.id}/${Date.now()}-${file.name}`;
    await c.env.STORAGE.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    // Remove old file if present
    if (item.storageKey) {
      await c.env.STORAGE.delete(item.storageKey);
    }

    const [updated] = await db
      .update(items)
      .set({ storageKey: key, updatedAt: new Date() })
      .where(eq(items.id, c.req.param("id")))
      .returning();

    return c.json({ data: updated });
  });
