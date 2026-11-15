/**
 * Router basename from Vite's base URL (`import.meta.env.BASE_URL`), which is
 * "/" by default or, for example, "/vadl/" when the site is served from a
 * sub-folder (`VADL_BASE=/vadl/ npm run build`). React Router expects no
 * trailing slash; the root becomes an empty basename.
 */
export function basenameFrom(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed === '' || trimmed === '.' ? '' : trimmed;
}
