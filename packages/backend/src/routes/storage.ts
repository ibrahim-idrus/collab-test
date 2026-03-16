import { Hono } from "hono";

/**
 * Storage routes for serving files from R2 Object Storage.
 * Files are served at /storage/:key
 */
export const storageRouter = new Hono<{ Bindings: Env }>()
  // GET /storage/:key - retrieve a file from R2
  .get("/:key{.+}", async (c) => {
    const key = c.req.param("key");
    const object = await c.env.STORAGE.get(key);

    if (!object) {
      return c.json({ error: "Object not found" }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  })

  // DELETE /storage/:key - delete a file from R2
  .delete("/:key{.+}", async (c) => {
    const key = c.req.param("key");
    await c.env.STORAGE.delete(key);
    return c.json({ data: { deleted: true } });
  });
