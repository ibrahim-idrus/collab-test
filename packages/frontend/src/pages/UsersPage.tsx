import { useFormik } from "formik";
import * as Yup from "yup";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/useUsers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import posthog from "@/lib/posthog";

// ─── Form schema ──────────────────────────────────────────────────────────────

const createUserSchema = Yup.object({
  name: Yup.string().min(1).max(255).required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  avatarUrl: Yup.string().url("Must be a valid URL").optional(),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const formik = useFormik({
    initialValues: { name: "", email: "", avatarUrl: "" },
    validationSchema: createUserSchema,
    onSubmit: async (values, helpers) => {
      const body = {
        name: values.name,
        email: values.email,
        ...(values.avatarUrl ? { avatarUrl: values.avatarUrl } : {}),
      };
      await createUser.mutateAsync(body);
      posthog.capture("user_created", { email: values.email });
      helpers.resetForm();
    },
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Users</h1>

      {/* Create user form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create User</CardTitle>
          <CardDescription>Add a new user to the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Alice Smith"
                  {...formik.getFieldProps("name")}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs text-destructive">{formik.errors.name}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alice@example.com"
                  {...formik.getFieldProps("email")}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-xs text-destructive">{formik.errors.email}</p>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
                <Input
                  id="avatarUrl"
                  placeholder="https://example.com/avatar.png"
                  {...formik.getFieldProps("avatarUrl")}
                />
                {formik.touched.avatarUrl && formik.errors.avatarUrl && (
                  <p className="text-xs text-destructive">{formik.errors.avatarUrl}</p>
                )}
              </div>
            </div>

            <Button type="submit" disabled={formik.isSubmitting || createUser.isPending}>
              {createUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Create User
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users list */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <p className="text-destructive text-center">
          Failed to load users. Is the backend running?
        </p>
      )}

      {users && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {users.length === 0 && (
            <p className="text-muted-foreground col-span-full text-center py-8">
              No users yet. Create one above!
            </p>
          )}
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4 flex items-center gap-4">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                    {user.name[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteUser.mutate(user.id)}
                  disabled={deleteUser.isPending}
                  aria-label="Delete user"
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
