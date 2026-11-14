import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError } from "../../../src/lib/errors";
import {
  ensureMethod,
  firstQueryValue,
  sendError,
  sendSuccess,
} from "../../../src/lib/http";
import { deleteUser, requireAdmin } from "../../../src/services/authService";
import type { User } from "../../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["DELETE"])) {
    return;
  }

  try {
    requireAdmin(req);

    const id = firstQueryValue(req.query.id);

    if (!id) {
      throw new ApiError(400, "MISSING_USER_ID", "Debes indicar el identificador del usuario.");
    }

    const user: User = deleteUser(id);
    sendSuccess<User>(res, user);
  } catch (error) {
    sendError(res, error);
  }
}
