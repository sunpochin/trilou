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
  const supabase = serverSupabaseClient(event);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  try {
    const body = await readBody(event);
    if (!body.title || !body.list_id) {
      throw createError({
        statusCode: 400,
        message: "\u5361\u7247\u6A19\u984C\u548C\u5217\u8868 ID \u70BA\u5FC5\u586B\u6B04\u4F4D"
      });
    }
    await ensureUserExists(supabase, user);
    const [listAccessResult, lastCardResult] = await Promise.all([
      // 驗證用戶是否有權限在此列表建立卡片
      supabase.from("lists").select("user_id").eq("id", body.list_id).maybeSingle(),
      // ✅ 查無資料時不回傳錯誤
      // 同時取得該列表中最大的 position 值（如果需要的話）
      typeof body.position !== "number" ? supabase.from("cards").select("position").eq("list_id", body.list_id).order("position", { ascending: false }).limit(1).maybeSingle() : (
        // 使用 maybeSingle 避免沒有卡片時的錯誤
        Promise.resolve({ data: null, error: null })
      )
    ]);
    if (listAccessResult.error) {
      console.error("Error checking list access:", listAccessResult.error.message);
      throw createError({
        statusCode: 500,
        message: "\u6AA2\u67E5\u5217\u8868\u6B0A\u9650\u5931\u6557"
      });
    }
    if (!listAccessResult.data || listAccessResult.data.user_id !== user.id) {
      throw createError({
        statusCode: 403,
        message: "\u6C92\u6709\u6B0A\u9650\u5728\u6B64\u5217\u8868\u5EFA\u7ACB\u5361\u7247"
      });
    }
    let position = body.position;
    if (typeof position !== "number") {
      position = lastCardResult.data ? lastCardResult.data.position + 1 : 0;
    }
    const { data, error } = await supabase.from("cards").insert({
      title: body.title,
      description: body.description,
      position,
      list_id: body.list_id,
      status: body.status
      // 包含 AI 生成任務的狀態標籤
    }).select().maybeSingle();
    if (error) {
      console.error("Error creating card:", error.message);
      throw createError({
        statusCode: 500,
        message: "\u5EFA\u7ACB\u5361\u7247\u5931\u6557"
      });
    }
    if (!data) {
      throw createError({
        statusCode: 500,
        message: "\u5EFA\u7ACB\u5361\u7247\u5931\u6557\uFF1A\u7121\u6CD5\u53D6\u5F97\u65B0\u5361\u7247\u8CC7\u6599"
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

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
