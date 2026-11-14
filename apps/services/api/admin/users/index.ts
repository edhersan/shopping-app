import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ensureMethod, sendError, sendSuccess } from "../../../src/lib/http";
import { listPublicUsers, requireAdmin } from "../../../src/services/authService";
import type { User } from "../../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["GET"])) {
    return;
  }

  try {
    requireAdmin(req);

    const users: User[] = listPublicUsers();
    sendSuccess<User[]>(res, users);
  } catch (error) {
    sendError(res, error);
  }
}
