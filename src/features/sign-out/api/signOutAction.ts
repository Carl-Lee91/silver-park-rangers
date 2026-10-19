"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/shared/api";
import { ROUTES } from "@/shared/config";

export async function signOutAction() {
  await signOut();
  redirect(ROUTES.login);
}
