import { d as defineEventHandler, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
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

const profile_post = defineEventHandler(async (event) => {
  var _a, _b;
  const supabase = serverSupabaseClient(event);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  try {
    const body = await readBody(event);
    const { data, error } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email || "",
      name: body.name || ((_a = user.user_metadata) == null ? void 0 : _a.name) || user.email || "Unknown User",
      avatar_url: body.avatar_url || ((_b = user.user_metadata) == null ? void 0 : _b.avatar_url) || null,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    }, {
      onConflict: "id"
    }).select().single();
    if (error) {
      console.error("\u5EFA\u7ACB\u7528\u6236\u8CC7\u6599\u5931\u6557:", error.message);
      if (error.message.includes("row-level security")) {
        throw createError({
          statusCode: 500,
          message: "\u8CC7\u6599\u5EAB\u6B0A\u9650\u8A2D\u5B9A\u554F\u984C\uFF0C\u9700\u8981\u7BA1\u7406\u54E1\u5354\u52A9\u8A2D\u5B9A users \u8868\u7684 RLS \u653F\u7B56"
        });
      }
      throw createError({
        statusCode: 500,
        message: "\u5EFA\u7ACB\u7528\u6236\u8CC7\u6599\u5931\u6557"
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

export { profile_post as default };
//# sourceMappingURL=profile.post.mjs.map
