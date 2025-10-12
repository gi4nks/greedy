import { auth } from '@/lib/auth.config';

export default auth((req: any) => {
  // Add any additional middleware logic here if needed
});

export const config = {
  matcher: [
    '/api/campaigns/:path*',
    '/api/characters/:path*',
    '/api/relationships/:path*',
    '/api/adventures/:path*',
    '/api/sessions/:path*',
    '/api/export/:path*',
    '/api/search/:path*',
    '/api/wiki/:path*',
    '/api/5etools/:path*',
    '/api/analytics/:path*',
    '/api/game-editions/:path*',
    '/api/images/:path*',
  ],
};