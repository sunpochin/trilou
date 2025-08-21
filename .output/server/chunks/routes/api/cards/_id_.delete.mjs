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
  const supabase = serverSupabaseClient(event);
  console.log("\u{1F510} [API] \u958B\u59CB\u9A57\u8B49\u7528\u6236\u8EAB\u4EFD...");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("\u274C [API] \u7528\u6236\u672A\u767B\u5165");
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  console.log("\u2705 [API] \u7528\u6236\u8EAB\u4EFD\u9A57\u8B49\u901A\u904E\uFF0C\u7528\u6236 ID:", user.id);
  try {
    const id = getRouterParam(event, "id");
    console.log("\u{1F5D1}\uFE0F [API] DELETE /api/cards/[id] \u6536\u5230\u8ACB\u6C42:");
    console.log("  \u{1F4CB} \u5361\u7247 ID:", id);
    console.log("  \u{1F464} \u7528\u6236 ID:", user.id);
    if (!id) {
      console.log("\u274C [API] \u932F\u8AA4: \u5361\u7247 ID \u70BA\u7A7A");
      throw createError({
        statusCode: 400,
        message: "\u5361\u7247 ID \u70BA\u5FC5\u586B\u53C3\u6578"
      });
    }
    console.log("\u{1F50D} [API] \u67E5\u8A62\u5361\u7247\u8CC7\u8A0A\u4E26\u9A57\u8B49\u6B0A\u9650...");
    const { data: cardInfo, error: queryError } = await supabase.from("cards").select(`
        id,
        title,
        list_id,
        lists!inner (
          id,
          title,
          user_id
        )
      `).eq("id", id).eq("lists.user_id", user.id).maybeSingle();
    if (queryError) {
      console.error("\u274C [API] \u8CC7\u6599\u5EAB\u67E5\u8A62\u932F\u8AA4:", queryError.message);
      throw createError({
        statusCode: 500,
        message: "\u67E5\u8A62\u5361\u7247\u5931\u6557"
      });
    }
    if (!cardInfo) {
      console.log("\u274C [API] \u932F\u8AA4: \u627E\u4E0D\u5230\u8981\u522A\u9664\u7684\u5361\u7247\u6216\u7121\u6B0A\u9650\u522A\u9664");
      throw createError({
        statusCode: 404,
        message: "\u627E\u4E0D\u5230\u8981\u522A\u9664\u7684\u5361\u7247\u6216\u7121\u6B0A\u9650\u522A\u9664"
      });
    }
    console.log("\u{1F4CA} [API] \u627E\u5230\u8981\u522A\u9664\u7684\u5361\u7247:", {
      id: cardInfo.id,
      title: cardInfo.title,
      listId: cardInfo.list_id,
      listTitle: cardInfo.lists.title,
      listOwner: cardInfo.lists.user_id
    });
    console.log("\u{1F504} [API] \u958B\u59CB\u57F7\u884C Supabase \u522A\u9664\u64CD\u4F5C...");
    const { error } = await supabase.from("cards").delete().eq("id", id);
    if (error) {
      console.error("\u274C [API] Supabase \u522A\u9664\u932F\u8AA4:");
      console.error("  \u{1F50D} \u932F\u8AA4\u8A0A\u606F:", error.message);
      console.error("  \u{1F50D} \u932F\u8AA4\u4EE3\u78BC:", error.code);
      console.error("  \u{1F50D} \u932F\u8AA4\u8A73\u60C5:", error.details);
      console.error("  \u{1F50D} \u932F\u8AA4\u63D0\u793A:", error.hint);
      throw createError({
        statusCode: 500,
        message: "\u522A\u9664\u5361\u7247\u5931\u6557"
      });
    }
    console.log("\u2705 [API] Supabase \u522A\u9664\u64CD\u4F5C\u6210\u529F!");
    console.log("\u{1F389} [API] \u5361\u7247\u522A\u9664\u6D41\u7A0B\u5B8C\u6210!");
    console.log("\u{1F4CB} [API] \u5DF2\u522A\u9664\u5361\u7247:", cardInfo.title);
    console.log("\u{1F4C1} [API] \u6240\u5C6C\u5217\u8868:", cardInfo.lists.title);
    return {
      id,
      message: "\u5361\u7247\u5DF2\u6210\u529F\u522A\u9664",
      deletedCard: {
        id: cardInfo.id,
        title: cardInfo.title,
        listTitle: cardInfo.lists.title
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
