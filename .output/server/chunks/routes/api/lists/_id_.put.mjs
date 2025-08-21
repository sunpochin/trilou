import { d as defineEventHandler, c as createError, g as getRouterParam, r as readBody } from '../../../nitro/nitro.mjs';
import { s as serverSupabaseClient } from '../../../_/supabase.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/ssr';

const _id__put = defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "\u5217\u8868 ID \u70BA\u5FC5\u586B\u53C3\u6578"
      });
    }
    if (!body.title && typeof body.position !== "number") {
      throw createError({
        statusCode: 400,
        message: "\u81F3\u5C11\u9700\u8981\u63D0\u4F9B\u4E00\u500B\u8981\u66F4\u65B0\u7684\u6B04\u4F4D"
      });
    }
    if (typeof body.position === "number" && body.position < 0) {
      throw createError({
        statusCode: 400,
        message: "\u4F4D\u7F6E\u5FC5\u9808\u70BA\u975E\u8CA0\u6578"
      });
    }
    const { data: listAccess, error: accessError } = await supabase.from("lists").select("user_id").eq("id", id).maybeSingle();
    if (accessError) {
      console.error("Error checking list access:", accessError.message);
      throw createError({
        statusCode: 500,
        message: "\u6AA2\u67E5\u5217\u8868\u6B0A\u9650\u5931\u6557"
      });
    }
    if (!listAccess || listAccess.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        message: "\u6C92\u6709\u6B0A\u9650\u7DE8\u8F2F\u6B64\u5217\u8868"
      });
    }
    const updateData = {};
    if (body.title) updateData.title = body.title;
    if (typeof body.position === "number") updateData.position = body.position;
    const { data, error } = await supabase.from("lists").update(updateData).eq("id", id).select().maybeSingle();
    if (error) {
      console.error("Error updating list:", error.message);
      throw createError({
        statusCode: 500,
        message: "\u66F4\u65B0\u5217\u8868\u5931\u6557"
      });
    }
    if (!data) {
      throw createError({
        statusCode: 404,
        message: "\u627E\u4E0D\u5230\u8981\u66F4\u65B0\u7684\u5217\u8868"
      });
    }
    return data;
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("Unexpected error:", error);
    throw createError({
      statusCode: 500,
      message: "\u4F3A\u670D\u5668\u5167\u90E8\u932F\u8AA4"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
