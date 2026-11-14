import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError } from "../../../../src/lib/errors";
import {
  ensureMethod,
  firstQueryValue,
  readJsonBody,
  sendError,
  sendSuccess,
} from "../../../../src/lib/http";
import { validateUpdateStockRequest } from "../../../../src/lib/validation";
import { requireAdmin } from "../../../../src/services/authService";
import { setProductStock } from "../../../../src/services/productsService";
import type { Product } from "../../../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["POST"])) {
    return;
  }

  try {
    requireAdmin(req);

    const id = firstQueryValue(req.query.id);

    if (!id) {
      throw new ApiError(400, "MISSING_PRODUCT_ID", "Debes indicar el identificador del producto.");
    }

    const body = readJsonBody(req);
    const stock = validateUpdateStockRequest(body);
    const product: Product = setProductStock(id, stock);

    sendSuccess<Product>(res, product);
  } catch (error) {
    sendError(res, error);
  }
}
