import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureMethod, sendError, sendSuccess } from "../../../src/lib/http";
import { requireAdmin } from "../../../src/services/authService";
import { listOrders } from "../../../src/store/orders";
import type { Order } from "../../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  try {
    requireAdmin(req);

    const orders: Order[] = listOrders();
    sendSuccess<Order[]>(res, orders);
  } catch (error) {
    sendError(res, error);
  }
}
