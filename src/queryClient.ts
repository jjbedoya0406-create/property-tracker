import { QueryClient } from "@tanstack/react-query";

// Sheets/Drive calls are comparatively slow round-trips to a REST API with
// its own rate limits, so we bias toward fewer refetches (longer staleTime)
// over the aggressive defaults tuned for typical low-latency REST backends.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});
