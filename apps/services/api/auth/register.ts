import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ensureMethod,
  readJsonBody,
  sendError,
  sendSuccess,
} from "../../src/lib/http";
import { validateRegisterRequest } from "../../src/lib/validation";
import { createAuthSession, registerUser } from "../../src/services/authService";
import type { AuthSession } from "../../src/types";

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (!ensureMethod(req, res, ["POST"])) {
    return;
  }

  try {
    const body = readJsonBody(req);
    const request = validateRegisterRequest(body);
    const session: AuthSession = createAuthSession(registerUser(request));

    sendSuccess<AuthSession>(res, session, 201);
  } catch (error) {
    sendError(res, error);
  }
}
