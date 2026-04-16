import { auth } from "@/auth";
import User, { type IUser } from "@/model/userModel";
import type { HydratedDocument } from "mongoose";

type AuthFailure = {
  error: string;
  status: 401 | 403 | 404;
};

type AuthSuccess = {
  user: HydratedDocument<IUser>;
  email: string;
};

export async function getAuthenticatedUser(
  select?: string
): Promise<AuthSuccess | AuthFailure> {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Authentication required", status: 401 };
  }

  const query = User.findOne({ email: session.user.email });
  const fields = select ? `${select} isActive` : undefined;
  if (fields) {
    query.select(fields);
  }

  const user = await query;
  if (!user) {
    return { error: "User not found", status: 404 };
  }

  if (user.isActive === false) {
    return { error: "Account is disabled", status: 403 };
  }

  return { user, email: session.user.email };
}

export async function getAuthenticatedAdmin(
  select?: string
): Promise<AuthSuccess | AuthFailure> {
  const adminSelect = select ? `${select} role` : "_id email role";
  const authResult = await getAuthenticatedUser(adminSelect);
  if ("error" in authResult) {
    return authResult;
  }

  if (authResult.user.role !== "admin") {
    return {
      error: "Forbidden: Admin access required",
      status: 403,
    };
  }

  return authResult;
}
