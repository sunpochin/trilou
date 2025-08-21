import { d as defineEventHandler, c as createError, r as readBody } from '../../nitro/nitro.mjs';
import { s as serverSupabaseClient } from '../../_/supabase.mjs';
import { e as ensureUserExists } from '../../_/userHelpers.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/ssr';

const index_post = defineEventHandler(async (event) => {
  console.log("\u{1F680} [LISTS POST] API \u88AB\u547C\u53EB");
  const supabase = serverSupabaseClient(event);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log("\u{1F510} [LISTS POST] Auth \u7D50\u679C:", { user: user == null ? void 0 : user.id, authError: authError == null ? void 0 : authError.message });
  if (!user) {
    console.log("\u274C [LISTS POST] \u7528\u6236\u672A\u8A8D\u8B49");
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  try {
    const body = await readBody(event);
    console.log("\u{1F4DD} [LISTS POST] Request body:", body);
    if (!body.title) {
      console.log("\u274C [LISTS POST] \u7F3A\u5C11\u5217\u8868\u6A19\u984C");
      throw createError({
        statusCode: 400,
        message: "\u5217\u8868\u6A19\u984C\u70BA\u5FC5\u586B\u6B04\u4F4D"
      });
    }
    console.log("\u{1F464} [LISTS POST] \u6AA2\u67E5\u7528\u6236\u662F\u5426\u5B58\u5728...");
    await ensureUserExists(supabase, user);
    console.log("\u2705 [LISTS POST] \u7528\u6236\u6AA2\u67E5\u5B8C\u6210");
    let position = body.position;
    console.log("\u{1F4CA} [LISTS POST] Position \u8655\u7406:", { providedPosition: body.position, typeCheck: typeof position });
    if (typeof position !== "number") {
      console.log("\u{1F522} [LISTS POST] \u8A08\u7B97\u65B0\u7684 position...");
      const { data: lastList, error: positionError } = await supabase.from("lists").select("position").eq("user_id", user.id).order("position", { ascending: false }).limit(1).maybeSingle();
      console.log("\u{1F4C8} [LISTS POST] Position \u67E5\u8A62\u7D50\u679C:", { lastList, positionError: positionError == null ? void 0 : positionError.message });
      position = lastList ? lastList.position + 1 : 0;
      console.log("\u{1F4CC} [LISTS POST] \u6700\u7D42 position:", position);
    }
    const { data, error } = await supabase.from("lists").insert({
      title: body.title,
      user_id: user.id,
      position
    }).select().maybeSingle();
    if (error) {
      console.error("\u274C [LISTS POST] Supabase \u63D2\u5165\u932F\u8AA4:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw createError({
        statusCode: 500,
        message: "\u5EFA\u7ACB\u5217\u8868\u5931\u6557"
      });
    }
    if (!data) {
      throw createError({
        statusCode: 500,
        message: "\u5EFA\u7ACB\u5217\u8868\u5931\u6557\uFF1A\u7121\u6CD5\u53D6\u5F97\u65B0\u5217\u8868\u8CC7\u6599"
      });
    }
    console.log("\u2705 [LISTS POST] \u5217\u8868\u5EFA\u7ACB\u6210\u529F:", data);
    return data;
  } catch (error) {
    console.error("\u{1F4A5} [LISTS POST] Catch \u5340\u584A\u6355\u7372\u932F\u8AA4:", error);
    if (error && typeof error === "object" && "statusCode" in error) {
      console.log("\u{1F504} [LISTS POST] \u91CD\u65B0\u62CB\u51FA\u5DF2\u77E5\u932F\u8AA4:", error);
      throw error;
    }
    console.error("\u274C [LISTS POST] \u672A\u9810\u671F\u932F\u8AA4:", error);
    throw createError({
      statusCode: 500,
      message: "\u4F3A\u670D\u5668\u5167\u90E8\u932F\u8AA4"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
