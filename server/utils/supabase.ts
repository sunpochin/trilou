import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type H3Event } from 'h3'

export const serverSupabaseClient = (event: H3Event) => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_KEY!

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return getCookie(event, name)
      },
      set(name: string, value: string, options: CookieOptions) {
        setCookie(event, name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        deleteCookie(event, name, options)
      },
    },
  })
}
