import { d as defineEventHandler, c as createError } from '../../nitro/nitro.mjs';
import { s as serverSupabaseClient } from '../../_/supabase.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/ssr';

const index_get = defineEventHandler(async (event) => {
  try {
    const supabase = serverSupabaseClient(event);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }
    console.log(`\u{1F50D} [LISTS-API] \u67E5\u8A62\u7528\u6236 ${user.id} \u7684\u5217\u8868`);
    const { data, error } = await supabase.from("lists").select("id, title, position").eq("user_id", user.id).order("position", { ascending: true });
    if (error) {
      console.error("\u274C [LISTS-API] Error fetching lists:", error.message);
      throw createError({
        statusCode: 500,
        message: "\u53D6\u5F97\u5217\u8868\u5931\u6557"
      });
    }
    console.log(`\u{1F4CA} [LISTS-API] \u67E5\u8A62\u7D50\u679C: \u627E\u5230 ${(data == null ? void 0 : data.length) || 0} \u500B\u5217\u8868`);
    console.log("\u{1F4CB} [LISTS-API] \u5217\u8868\u8A73\u60C5:", data);
    return data || [];
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u4F3A\u670D\u5668\u5167\u90E8\u932F\u8AA4"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
