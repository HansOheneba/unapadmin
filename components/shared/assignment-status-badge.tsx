import { Badge } from "@/components/ui/badge";
import { ASSIGNMENT_STATUS_LABELS } from "@/lib/delivery";
import type { AssignmentStatus } from "@/types";

const variants: Record<
  AssignmentStatus,
  "zinc" | "blue" | "indigo" | "orange" | "emerald" | "red"
> = {
  unassigned: "zinc",
  assigned: "blue",
  picked_up: "indigo",
  out_for_delivery: "orange",
  delivered: "emerald",
  failed: "red",
};

export function AssignmentStatusBadge({
  status,
}: {
  status: AssignmentStatus;
}) {
  return (
    <Badge variant={variants[status]}>
      {ASSIGNMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
