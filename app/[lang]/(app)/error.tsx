"use client";
// Error inside the logged-in site: the header stays, the page shows a retry.
import { ErrorView } from "@/components/error-view";

export default function AppError(props: { error: unknown; retry: () => void }) {
  return <ErrorView {...props} />;
}
