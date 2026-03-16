/**
 * PostHog analytics singleton.
 * Usage: import posthog from '@/lib/posthog'; posthog.capture('event');
 */
import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_API_KEY as string;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) ?? "https://us.i.posthog.com";

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // We'll capture manually via React Router
  });
} else {
  console.warn("[PostHog] VITE_POSTHOG_API_KEY is not set – analytics disabled.");
}

export default posthog;
