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
    console.log("\u{1F680} [API] PUT /api/cards/[id] \u6536\u5230\u8ACB\u6C42:");
    console.log("  \u{1F4CB} \u5361\u7247 ID:", id);
    console.log("  \u{1F4DD} \u8ACB\u6C42 body:", JSON.stringify(body, null, 2));
    console.log("  \u{1F464} \u7528\u6236 ID:", user.id);
    if (!id) {
      console.log("\u274C [API] \u932F\u8AA4: \u5361\u7247 ID \u70BA\u7A7A");
      throw createError({
        statusCode: 400,
        message: "\u5361\u7247 ID \u70BA\u5FC5\u586B\u53C3\u6578"
      });
    }
    if (!body.title && !body.description && typeof body.position !== "number" && !body.list_id && !body.due_date && !body.status) {
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
    console.log("\u{1F510} [API] \u9A57\u8B49\u5361\u7247\u5B58\u53D6\u6B0A\u9650...");
    const { data: cardAccess, error: accessError } = await supabase.from("cards").select(`
        list_id,
        lists!inner (
          user_id
        )
      `).eq("id", id).eq("lists.user_id", user.id).maybeSingle();
    if (accessError) {
      console.error("\u274C [API] \u8CC7\u6599\u5EAB\u67E5\u8A62\u932F\u8AA4:", accessError.message);
      throw createError({
        statusCode: 500,
        message: "\u67E5\u8A62\u5361\u7247\u6B0A\u9650\u5931\u6557"
      });
    }
    console.log("\u{1F4CA} [API] \u5361\u7247\u5B58\u53D6\u9A57\u8B49\u7D50\u679C:", cardAccess);
    if (!cardAccess) {
      console.log("\u274C [API] \u932F\u8AA4: \u6C92\u6709\u6B0A\u9650\u7DE8\u8F2F\u6B64\u5361\u7247");
      throw createError({
        statusCode: 403,
        message: "\u6C92\u6709\u6B0A\u9650\u7DE8\u8F2F\u6B64\u5361\u7247"
      });
    }
    console.log("\u2705 [API] \u5361\u7247\u5B58\u53D6\u6B0A\u9650\u9A57\u8B49\u901A\u904E");
    if (body.list_id && body.list_id !== cardAccess.list_id) {
      console.log("\u{1F504} [API] \u6AA2\u6E2C\u5230\u8DE8\u5217\u8868\u79FB\u52D5:");
      console.log("  \u{1F4E4} \u539F\u59CB\u5217\u8868 ID:", cardAccess.list_id);
      console.log("  \u{1F4E5} \u76EE\u6A19\u5217\u8868 ID:", body.list_id);
      const { data: targetListAccess } = await supabase.from("lists").select("user_id").eq("id", body.list_id).maybeSingle();
      console.log("\u{1F4CA} [API] \u76EE\u6A19\u5217\u8868\u5B58\u53D6\u9A57\u8B49\u7D50\u679C:", targetListAccess);
      if (!targetListAccess || targetListAccess.user_id !== user.id) {
        console.log("\u274C [API] \u932F\u8AA4: \u6C92\u6709\u6B0A\u9650\u5C07\u5361\u7247\u79FB\u52D5\u5230\u76EE\u6A19\u5217\u8868");
        throw createError({
          statusCode: 403,
          message: "\u6C92\u6709\u6B0A\u9650\u5C07\u5361\u7247\u79FB\u52D5\u5230\u76EE\u6A19\u5217\u8868"
        });
      }
      console.log("\u2705 [API] \u76EE\u6A19\u5217\u8868\u5B58\u53D6\u6B0A\u9650\u9A57\u8B49\u901A\u904E");
    } else if (body.list_id) {
      console.log("\u{1F4CD} [API] \u5361\u7247\u5728\u540C\u4E00\u5217\u8868\u5167\u79FB\u52D5");
    }
    const updateData = {};
    if (body.title) updateData.title = body.title;
    if (body.description !== void 0) updateData.description = body.description;
    if (typeof body.position === "number") updateData.position = body.position;
    if (body.list_id) updateData.list_id = body.list_id;
    if (body.due_date !== void 0) updateData.due_date = body.due_date;
    if (body.status !== void 0) updateData.status = body.status;
    console.log("\u{1F4DD} [API] \u6E96\u5099\u66F4\u65B0\u7684\u8CC7\u6599:", JSON.stringify(updateData, null, 2));
    const { data: beforeUpdate } = await supabase.from("cards").select("*").eq("id", id).maybeSingle();
    console.log("\u{1F4CA} [API] \u66F4\u65B0\u524D\u7684\u5361\u7247\u72C0\u614B:", beforeUpdate);
    console.log("\u{1F504} [API] \u958B\u59CB\u57F7\u884C Supabase \u66F4\u65B0\u64CD\u4F5C...");
    const { data, error } = await supabase.from("cards").update(updateData).eq("id", id).select().maybeSingle();
    if (error) {
      console.error("\u274C [API] Supabase \u66F4\u65B0\u932F\u8AA4:");
      console.error("  \u{1F50D} \u932F\u8AA4\u8A0A\u606F:", error.message);
      console.error("  \u{1F50D} \u932F\u8AA4\u4EE3\u78BC:", error.code);
      console.error("  \u{1F50D} \u932F\u8AA4\u8A73\u60C5:", error.details);
      console.error("  \u{1F50D} \u932F\u8AA4\u63D0\u793A:", error.hint);
      throw createError({
        statusCode: 500,
        message: "\u66F4\u65B0\u5361\u7247\u5931\u6557"
      });
    }
    if (!data) {
      console.log("\u274C [API] \u932F\u8AA4: \u627E\u4E0D\u5230\u8981\u66F4\u65B0\u7684\u5361\u7247");
      throw createError({
        statusCode: 404,
        message: "\u627E\u4E0D\u5230\u8981\u66F4\u65B0\u7684\u5361\u7247"
      });
    }
    console.log("\u2705 [API] Supabase \u66F4\u65B0\u6210\u529F!");
    console.log("\u{1F4CA} [API] \u66F4\u65B0\u5F8C\u7684\u5361\u7247\u8CC7\u6599:", JSON.stringify(data, null, 2));
    const { data: afterUpdate } = await supabase.from("cards").select("*").eq("id", id).maybeSingle();
    console.log("\u{1F50D} [API] \u9A57\u8B49\u66F4\u65B0\u7D50\u679C - \u5F9E\u8CC7\u6599\u5EAB\u91CD\u65B0\u67E5\u8A62:", afterUpdate);
    if (body.position !== void 0 && (afterUpdate == null ? void 0 : afterUpdate.position) !== body.position) {
      console.log("\u26A0\uFE0F [API] \u8B66\u544A: position \u66F4\u65B0\u53EF\u80FD\u672A\u751F\u6548");
      console.log("  \u671F\u671B position:", body.position);
      console.log("  \u5BE6\u969B position:", afterUpdate == null ? void 0 : afterUpdate.position);
    }
    if (body.list_id && (afterUpdate == null ? void 0 : afterUpdate.list_id) !== body.list_id) {
      console.log("\u26A0\uFE0F [API] \u8B66\u544A: list_id \u66F4\u65B0\u53EF\u80FD\u672A\u751F\u6548");
      console.log("  \u671F\u671B list_id:", body.list_id);
      console.log("  \u5BE6\u969B list_id:", afterUpdate == null ? void 0 : afterUpdate.list_id);
    }
    return data;
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

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
