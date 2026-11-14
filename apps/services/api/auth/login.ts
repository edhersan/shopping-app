import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ensureMethod,
  readJsonBody,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { validateLoginRequest } from "../../src/lib/validation";
import { authenticate, createAuthSession } from "../../src/services/authService";
import type { AuthSession } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["POST"])) {
    return;
  }

  try {
    const body = readJsonBody(req);
    const request = validateLoginRequest(body);
    const session: AuthSession = createAuthSession(authenticate(request));

    sendSuccess<AuthSession>(res, session);
  } catch (error) {
    sendError(res, error);
  }
}
