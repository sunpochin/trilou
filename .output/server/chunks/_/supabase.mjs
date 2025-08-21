import { b as deleteCookie, s as setCookie, e as getCookie } from '../nitro/nitro.mjs';
import { createServerClient } from '@supabase/ssr';

const serverSupabaseClient = (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name) {
        return getCookie(event, name);
      },
      set(name, value, options) {
        setCookie(event, name, value, options);
      },
      remove(name, options) {
        deleteCookie(event, name, options);
      }
    }
  });
};

export { serverSupabaseClient as s };
//# sourceMappingURL=supabase.mjs.map
