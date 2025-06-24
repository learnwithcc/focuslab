import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { createThemeCookie, THEMES, type ThemeValue } from '~/utils/theme';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const theme = formData.get('theme') as ThemeValue;
  
  // Validate theme value
  if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
    return json({ error: 'Invalid theme value' }, { status: 400 });
  }
  
  // Set theme cookie
  return json(
    { success: true, theme },
    {
      headers: {
        'Set-Cookie': createThemeCookie(theme),
      },
    }
  );
}