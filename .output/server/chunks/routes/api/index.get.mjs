import { d as defineEventHandler, c as createError, a as getQuery } from '../../nitro/nitro.mjs';
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
  const supabase = serverSupabaseClient(event);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  try {
    const urlQuery = getQuery(event);
    const listId = urlQuery.list_id;
    console.log(`\u{1F50D} [CARDS-API] \u67E5\u8A62\u7528\u6236 ${user.id} \u7684\u5361\u7247`, listId ? `(\u5217\u8868 ${listId})` : "(\u6240\u6709\u5217\u8868)");
    let dbQuery = supabase.from("cards").select(`
        id,
        title,
        description, 
        position,
        list_id,
        status,
        lists!inner(user_id)
      `).eq("lists.user_id", user.id).order("list_id", { ascending: true }).order("position", { ascending: true });
    if (listId) {
      dbQuery = dbQuery.eq("list_id", listId);
    }
    const { data, error } = await dbQuery;
    if (error) {
      console.error("\u274C [CARDS-API] \u8CC7\u6599\u5EAB\u67E5\u8A62\u932F\u8AA4:", error.message);
      throw createError({
        statusCode: 500,
        message: "\u53D6\u5F97\u5361\u7247\u8CC7\u6599\u5931\u6557"
      });
    }
    console.log(`\u{1F4CA} [CARDS-API] \u67E5\u8A62\u7D50\u679C: \u627E\u5230 ${(data == null ? void 0 : data.length) || 0} \u500B Cards`);
    const cleanedData = (data == null ? void 0 : data.map((card) => {
      const { lists, ...cardData } = card;
      return cardData;
    })) || [];
    console.log("\u{1F4CB} [CARDS-API] \u5361\u7247\u6392\u5E8F\u8A73\u60C5:");
    cleanedData.forEach((card, index) => {
      console.log(`  ${index}: "${card.title}" (list: ${card.list_id}, position: ${card.position})`);
    });
    return cleanedData;
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("\u274C [CARDS-API] \u672A\u9810\u671F\u7684\u932F\u8AA4:", error);
    throw createError({
      statusCode: 500,
      message: "\u4F3A\u670D\u5668\u5167\u90E8\u932F\u8AA4"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
