import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "../db";
import { users, type NewUser } from "../db/schema";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  avatarUrl: z.string().url().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const usersRouter = new Hono<{ Bindings: Env }>()
  // GET /users - list all active users
  .get("/", async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const allUsers = await db.query.users.findMany({
      where: (u, { eq }) => eq(u.isActive, true),
      orderBy: (u, { desc }) => [desc(u.createdAt)],
    });
    return c.json({ data: allUsers });
  })

  // GET /users/:id - get user by ID
  .get("/:id", async (c) => {
    const db = createDb(c.env.DATABASE_URL);
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, c.req.param("id")),
      with: { items: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ data: user });
  })

  // POST /users - create user
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DATABASE_URL);

    const [newUser] = await db
      .insert(users)
      .values(body as NewUser)
      .returning();

    return c.json({ data: newUser }, 201);
  })

  // PATCH /users/:id - update user
  .patch("/:id", zValidator("json", updateUserSchema), async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DATABASE_URL);

    const [updated] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, c.req.param("id")))
      .returning();

    if (!updated) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ data: updated });
  })

  // DELETE /users/:id - soft-delete user
  .delete("/:id", async (c) => {
    const db = createDb(c.env.DATABASE_URL);

    const [deleted] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, c.req.param("id")))
      .returning();

    if (!deleted) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ data: deleted });
  });
