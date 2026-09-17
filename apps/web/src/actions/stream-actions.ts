"use server";

import { revalidateTag } from "next/cache";
import { REVALIDATION_TAGS } from "@/lib/tags";

export async function refreshStreamData() {
  revalidateTag(REVALIDATION_TAGS.stream);
  return { success: true as const, message: "تم تحديث بيانات البث المباشر" };
}
