import { createFileRoute, Navigate } from "@tanstack/react-router";

// Withdrawals share the funding_requests table; the detail view lives at /admin/funding/$id.
export const Route = createFileRoute("/admin/withdrawals/$id")({
  component: () => {
    const { id } = Route.useParams();
    return <Navigate to="/admin/funding/$id" params={{ id }} replace />;
  },
});
