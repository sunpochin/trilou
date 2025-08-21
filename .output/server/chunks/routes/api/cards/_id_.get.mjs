import { d as defineEventHandler, c as createError, g as getRouterParam } from '../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const supabase = serverSupabaseClient(event);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        message: "\u5361\u7247 ID \u70BA\u5FC5\u586B\u53C3\u6578"
      });
    }
    const { data, error } = await supabase.from("cards").select(`
        *,
        lists!inner (
          id,
          title,
          user_id
        )
      `).eq("id", id).eq("lists.user_id", user.id).maybeSingle();
    if (error) {
      console.error("\u274C [API] \u8CC7\u6599\u5EAB\u67E5\u8A62\u932F\u8AA4:", error.message);
      throw createError({
        statusCode: 500,
        message: "\u7372\u53D6\u5361\u7247\u8CC7\u6599\u5931\u6557"
      });
    }
    if (!data) {
      console.log("\u274C [API] \u627E\u4E0D\u5230\u6307\u5B9A\u7684\u5361\u7247\u6216\u7121\u6B0A\u9650\u5B58\u53D6");
      throw createError({
        statusCode: 404,
        message: "\u627E\u4E0D\u5230\u6307\u5B9A\u7684\u5361\u7247\u6216\u60A8\u6C92\u6709\u6B0A\u9650\u5B58\u53D6"
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

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
