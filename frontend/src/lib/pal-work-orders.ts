import palWorkOrders from "@/data/pal-work-orders.json";
import { normalizeWorkOrders, type PalWorkOrder } from "@/lib/pal-types";

type WorkOrdersMap = Record<string, Array<string | PalWorkOrder>>;

const WORK_BY_NAME = palWorkOrders as WorkOrdersMap;

/**
 * Prefer leveled suitability from pal-work-orders.json when API/DB only has
 * role tags or all levels default to 1.
 */
export function resolveWorkOrders(
  name: string,
  workOrders: Array<string | PalWorkOrder> | undefined | null,
): PalWorkOrder[] {
  const overlay = WORK_BY_NAME[name];
  if (overlay?.length) {
    return normalizeWorkOrders(overlay);
  }
  return normalizeWorkOrders(workOrders ?? []);
}
