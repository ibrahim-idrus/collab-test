import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useItems, useCreateItem, useDeleteItem } from "@/hooks/useItems";
import { useUsers } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import posthog from "@/lib/posthog";

// ─── Form schema ──────────────────────────────────────────────────────────────

const createItemSchema = Yup.object({
  title: Yup.string().min(1).max(255).required("Title is required"),
  description: Yup.string().optional(),
  authorId: Yup.string().uuid("Must select a valid user").required("Author is required"),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function ItemsPage() {
  const { data: items, isLoading, isError } = useItems();
  const { data: users } = useUsers();
  const createItem = useCreateItem();
  const deleteItem = useDeleteItem();

  const formik = useFormik({
    initialValues: { title: "", description: "", authorId: "" },
    validationSchema: createItemSchema,
    onSubmit: async (values, helpers) => {
      const body = {
        title: values.title,
        authorId: values.authorId,
        ...(values.description ? { description: values.description } : {}),
      };
      await createItem.mutateAsync(body);
      posthog.capture("item_created", { title: values.title });
      helpers.resetForm();
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Items</h1>

      {/* Create item form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create Item</CardTitle>
          <CardDescription>Add a new item to the collection.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="My awesome item"
                {...formik.getFieldProps("title")}
              />
              {formik.touched.title && formik.errors.title && (
                <p className="text-xs text-destructive">{formik.errors.title}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="A short description..."
                rows={3}
                {...formik.getFieldProps("description")}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="authorId">Author *</Label>
              <select
                id="authorId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...formik.getFieldProps("authorId")}
              >
                <option value="">Select a user...</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
              {formik.touched.authorId && formik.errors.authorId && (
                <p className="text-xs text-destructive">{formik.errors.authorId}</p>
              )}
            </div>

            <Button type="submit" disabled={formik.isSubmitting || createItem.isPending}>
              {createItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create Item
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Items list */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <p className="text-destructive text-center">
          Failed to load items. Is the backend running?
        </p>
      )}

      {items && (
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              No items yet. Create one above!
            </p>
          )}
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {item.author && <span>By {item.author.name}</span>}
                    <span>{item.viewCount} views</span>
                    {item.storageKey && <span>📎 Attachment</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteItem.mutate(item.id)}
                  disabled={deleteItem.isPending}
                  aria-label="Delete item"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
