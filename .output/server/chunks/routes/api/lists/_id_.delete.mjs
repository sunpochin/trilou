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

const _id__delete = defineEventHandler(async (event) => {
  var _a, _b;
  const supabase = serverSupabaseClient(event);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  try {
    const id = getRouterParam(event, "id");
    console.log("\u{1F5D1}\uFE0F [API] DELETE /api/lists/[id] \u6536\u5230\u8ACB\u6C42:");
    console.log("  \u{1F4CB} \u5217\u8868 ID:", id);
    console.log("  \u{1F464} \u7528\u6236 ID:", user.id);
    if (!id) {
      console.log("\u274C [API] \u932F\u8AA4: \u5217\u8868 ID \u70BA\u7A7A");
      throw createError({
        statusCode: 400,
        message: "\u5217\u8868 ID \u70BA\u5FC5\u586B\u53C3\u6578"
      });
    }
    console.log("\u{1F50D} [API] \u67E5\u8A62\u8981\u522A\u9664\u7684\u5217\u8868\u8CC7\u8A0A...");
    const { data: existingList, error: queryError } = await supabase.from("lists").select("id, title, user_id, cards(count)").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (queryError) {
      console.error("\u274C [API] \u67E5\u8A62\u5217\u8868\u932F\u8AA4:", queryError.message);
      throw createError({
        statusCode: 500,
        message: "\u67E5\u8A62\u5217\u8868\u5931\u6557"
      });
    }
    if (!existingList) {
      console.log("\u274C [API] \u932F\u8AA4: \u627E\u4E0D\u5230\u8981\u522A\u9664\u7684\u5217\u8868\u6216\u7121\u6B0A\u9650\u522A\u9664");
      throw createError({
        statusCode: 404,
        message: "\u627E\u4E0D\u5230\u8981\u522A\u9664\u7684\u5217\u8868\u6216\u7121\u6B0A\u9650\u522A\u9664"
      });
    }
    console.log("\u{1F4CA} [API] \u627E\u5230\u8981\u522A\u9664\u7684\u5217\u8868:", {
      id: existingList.id,
      title: existingList.title,
      cardsCount: ((_b = (_a = existingList.cards) == null ? void 0 : _a[0]) == null ? void 0 : _b.count) || 0
    });
    console.log("\u{1F9F8} [API] \u6B65\u9A5F1: \u5148\u6E05\u7A7A\u73A9\u5177\u7BB1\uFF08\u522A\u9664\u5217\u8868\u4E2D\u7684\u6240\u6709\u5361\u7247\uFF09...");
    const { error: cardsDeleteError } = await supabase.from("cards").delete().eq("list_id", id);
    if (cardsDeleteError) {
      console.error("\u274C [API] \u522A\u9664\u5361\u7247\u932F\u8AA4:");
      console.error("  \u{1F50D} \u932F\u8AA4\u8A0A\u606F:", cardsDeleteError.message);
      console.error("  \u{1F50D} \u932F\u8AA4\u4EE3\u78BC:", cardsDeleteError.code);
      console.error("  \u{1F50D} \u932F\u8AA4\u8A73\u60C5:", cardsDeleteError.details);
      throw createError({
        statusCode: 500,
        message: "\u6E05\u7A7A\u5217\u8868\u5361\u7247\u5931\u6557"
      });
    }
    console.log("\u2705 [API] \u6B65\u9A5F1\u5B8C\u6210: \u73A9\u5177\u7BB1\u5DF2\u6E05\u7A7A\uFF08\u6240\u6709\u5361\u7247\u5DF2\u522A\u9664\uFF09");
    console.log("\u{1F4E6} [API] \u6B65\u9A5F2: \u4E1F\u6389\u7A7A\u7684\u73A9\u5177\u7BB1\uFF08\u522A\u9664\u5217\u8868\uFF09...");
    const { error } = await supabase.from("lists").delete().eq("id", id).eq("user_id", user.id);
    if (error) {
      console.error("\u274C [API] \u522A\u9664\u5217\u8868\u932F\u8AA4:");
      console.error("  \u{1F50D} \u932F\u8AA4\u8A0A\u606F:", error.message);
      console.error("  \u{1F50D} \u932F\u8AA4\u4EE3\u78BC:", error.code);
      console.error("  \u{1F50D} \u932F\u8AA4\u8A73\u60C5:", error.details);
      console.error("  \u{1F50D} \u932F\u8AA4\u63D0\u793A:", error.hint);
      throw createError({
        statusCode: 500,
        message: "\u522A\u9664\u5217\u8868\u5931\u6557"
      });
    }
    console.log("\u2705 [API] \u6B65\u9A5F2\u5B8C\u6210: \u73A9\u5177\u7BB1\u5DF2\u4E1F\u6389\uFF08\u5217\u8868\u522A\u9664\u6210\u529F\uFF09!");
    console.log("\u{1F389} [API] \u6574\u500B\u522A\u9664\u6D41\u7A0B\u5B8C\u6210!");
    console.log("\u{1F4CB} [API] \u5DF2\u522A\u9664\u5217\u8868:", existingList.title);
    console.log("\u{1F9F8} [API] \u8A72\u5217\u8868\u7684\u6240\u6709\u5361\u7247\u4E5F\u5DF2\u7D93\u6E05\u7A7A");
    return {
      id,
      message: "\u5217\u8868\u5DF2\u6210\u529F\u522A\u9664",
      deletedList: {
        id: existingList.id,
        title: existingList.title
      }
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      console.log("\u{1F6A8} [API] \u5DF2\u77E5\u932F\u8AA4\u88AB\u91CD\u65B0\u62CB\u51FA:", error);
      throw error;
    }
    console.error("\u{1F4A5} [API] \u672A\u9810\u671F\u7684\u932F\u8AA4:");
    console.error("  \u{1F50D} \u932F\u8AA4\u985E\u578B:", typeof error);
    console.error("  \u{1F50D} \u932F\u8AA4\u5167\u5BB9:", error);
    console.error("  \u{1F50D} \u932F\u8AA4\u5806\u758A:", error instanceof Error ? error.stack : "\u7121\u5806\u758A\u8CC7\u8A0A");
    throw createError({
      statusCode: 500,
      message: "\u4F3A\u670D\u5668\u5167\u90E8\u932F\u8AA4"
    });
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
