import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          const cookieHeader = context.request.headers.get('cookie');

          if (!cookieHeader) {
            return [];
          }

          return cookieHeader
            .split(';')
            .filter(Boolean)
            .map((cookie) => {
              const separatorIndex = cookie.indexOf('=');

              if (separatorIndex === -1) {
                return {
                  name: cookie.trim(),
                  value: '',
                };
              }

              return {
                name: cookie.slice(0, separatorIndex).trim(),
                value: cookie.slice(separatorIndex + 1),
              };
            });
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = context.url.pathname;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) {
      return context.redirect('/admin/login');
    }
  }

  return next();
});