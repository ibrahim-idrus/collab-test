import { Link } from "react-router-dom";
import { Users, Package, Cloud, Database, BarChart3, Layers } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Cloud,
    title: "Cloudflare Workers",
    description: "Edge-deployed API with zero cold starts, powered by Hono.",
  },
  {
    icon: Database,
    title: "NeonDB + DrizzleORM",
    description: "Serverless PostgreSQL with a type-safe query builder.",
  },
  {
    icon: Layers,
    title: "R2 Object Storage & Queue",
    description: "File uploads and background task processing via Cloudflare primitives.",
  },
  {
    icon: BarChart3,
    title: "PostHog Analytics",
    description: "Product analytics to understand how users interact with the app.",
  },
];

export default function HomePage() {
  return (
    <div className="container mx-auto py-16 px-4 max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold tracking-tight mb-4">collab-test</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A full-stack monorepo built with Vite + React, Hono, DrizzleORM, NeonDB, Cloudflare
          Workers, R2, Queue, PostHog, React Query, and Formik.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <Button asChild size="lg">
            <Link to="/users">
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/items">
              <Package className="h-4 w-4" />
              Browse Items
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
