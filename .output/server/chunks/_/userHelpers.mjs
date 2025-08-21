import { c as createError } from '../nitro/nitro.mjs';

async function ensureUserExists(supabase, user) {
  var _a, _b;
  console.log("\u{1F50D} [USER_HELPER] \u6AA2\u67E5\u7528\u6236\u662F\u5426\u5B58\u5728:", user.id);
  const { data: existingUser, error: userCheckError } = await supabase.from("users").select("id").eq("id", user.id).maybeSingle();
  console.log("\u{1F4CB} [USER_HELPER] \u7528\u6236\u6AA2\u67E5\u7D50\u679C:", {
    existingUser,
    userCheckError: userCheckError == null ? void 0 : userCheckError.message,
    code: userCheckError == null ? void 0 : userCheckError.code
  });
  if (existingUser) {
    console.log("\u2705 [USER_HELPER] \u7528\u6236\u5DF2\u5B58\u5728");
    return;
  }
  if (userCheckError) {
    console.error("\u274C [USER_HELPER] \u67E5\u8A62\u7528\u6236\u6642\u767C\u751F\u932F\u8AA4\uFF1A", userCheckError.message);
    throw createError({
      statusCode: 500,
      message: "\u6AA2\u67E5\u7528\u6236\u72C0\u614B\u5931\u6557"
    });
  }
  if (!existingUser) {
    console.log("\u{1F464} [USER_HELPER] \u7528\u6236\u4E0D\u5B58\u5728\uFF0C\u5617\u8A66\u5EFA\u7ACB\u7528\u6236\u8A18\u9304...");
    const { error: createUserError } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email || "",
      name: ((_a = user.user_metadata) == null ? void 0 : _a.name) || user.email || "Unknown User",
      avatar_url: ((_b = user.user_metadata) == null ? void 0 : _b.avatar_url) || null
    }, {
      onConflict: "id"
      // 如果 ID 衝突就更新
    });
    if (createUserError) {
      console.error("\u274C [USER_HELPER] \u5EFA\u7ACB\u7528\u6236\u5931\u6557:", createUserError);
      if (createUserError.message.includes("row-level security")) {
        throw createError({
          statusCode: 500,
          message: "\u8CC7\u6599\u5EAB\u6B0A\u9650\u8A2D\u5B9A\u554F\u984C\uFF1A\u8ACB\u5728 Supabase \u4E2D\u8A2D\u5B9A users \u8868\u7684 RLS \u653F\u7B56\uFF0C\u5141\u8A31\u5DF2\u8A8D\u8B49\u7528\u6236\u5EFA\u7ACB\u81EA\u5DF1\u7684\u8A18\u9304"
        });
      }
      throw createError({
        statusCode: 500,
        message: `\u5EFA\u7ACB\u7528\u6236\u8A18\u9304\u5931\u6557: ${createUserError.message}`
      });
    }
    console.log("\u2705 [USER_HELPER] \u7528\u6236\u8A18\u9304\u5EFA\u7ACB/\u66F4\u65B0\u6210\u529F");
  }
}

export { ensureUserExists as e };
//# sourceMappingURL=userHelpers.mjs.map
