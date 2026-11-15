# VADL deployment guide

VADL is a static site: HTML, JavaScript, CSS and one icon. It needs no server code, no database
and no secrets, so any static web host can serve it. Choosing the host is the project owner's
decision (D12); this guide prepares each likely option.

## 1. Build

```bash
npm ci
npm run check            # every quality gate; do not deploy a build that fails it
npm run build            # output in dist/
```

`dist/` holds `index.html`, `404.html` (a copy of `index.html`), `_redirects`, `favicon.svg` and
`assets/`. Upload the **contents** of `dist/`.

### Serving from a sub-folder

If the site lives at, for example, `https://host.example/vadl/` rather than at the root of a
host, build with the sub-folder named:

```bash
VADL_BASE=/vadl/ npm run build
```

In Windows PowerShell: `$env:VADL_BASE='/vadl/'; npm run build; Remove-Item Env:VADL_BASE`.

Every asset path and every page link then starts with `/vadl/`. `npm run test:e2e:base` builds
such a version into `dist-base/` and checks it in a browser. `VADL_BASE` configures the build
only; it is not placed in the application bundle.

## 2. The one hosting rule: deep links

VADL uses ordinary page addresses such as `/modules/pneumatics`. A student who reloads that
page, or opens it from a link, asks the host for a file that does not exist. The host must answer
with `index.html` instead, and the application then shows the right page. Each option below
does this differently.

| Host                           | How deep links work                                                                      | Notes                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UTeM web server, Apache        | `.htaccess` below                                                                        | Ask the server administrator whether `.htaccess` overrides are allowed                                                                                                 |
| UTeM web server, IIS           | `web.config` below (needs the IIS URL Rewrite module)                                    |                                                                                                                                                                        |
| UTeM web server, nginx         | `try_files` below, added by the administrator                                            |                                                                                                                                                                        |
| GitHub Pages                   | `404.html` is already in the build                                                       | Pages answers with status 404, which browsers display normally; build with `VADL_BASE=/<repository>/` for a project site. The repository must be public on a free plan |
| Netlify, Cloudflare Pages      | `_redirects` is already in the build                                                     | Free tiers are enough for a class                                                                                                                                      |
| Azure Static Web Apps          | Add `staticwebapp.config.json` below                                                     |                                                                                                                                                                        |
| Any host, no rewrites possible | Not supported by this build; would need hash addresses (`/#/modules/...`), a code change |                                                                                                                                                                        |

### Apache `.htaccess` (in the site folder)

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . index.html [L]
```

### IIS `web.config` (in the site folder)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="VADL deep links" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <remove fileExtension=".svg" />
      <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
    </staticContent>
  </system.webServer>
</configuration>
```

### nginx

```nginx
location /vadl/ {
    try_files $uri $uri/ /vadl/index.html;
}
```

(Use `location /` and `/index.html` when VADL is at the root.)

### Azure Static Web Apps `staticwebapp.config.json` (put it in `public/` before building)

```json
{ "navigationFallback": { "rewrite": "/index.html", "exclude": ["/assets/*", "/favicon.svg"] } }
```

## 3. Recommended host settings

- **HTTPS** only.
- **Caching:** files in `assets/` have content hashes in their names and can be cached for a
  year (`Cache-Control: public, max-age=31536000, immutable`). `index.html` and `404.html` must
  not be cached for long (`Cache-Control: no-cache`), so students get a new version at once.
- **Compression:** gzip or Brotli for `.js`, `.css`, `.html` and `.svg`. The largest file, the
  graph library, is about 385 kB, or 110 kB compressed.
- **Security headers** (optional, recommended): `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, and a Content Security Policy such as
  `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:`. Test every
  laboratory after adding a policy.

## 4. After deploying

1. Open the site's root, then reload a deep link such as `/modules/pneumatics`.
2. Start a laboratory, record a measurement, open its report and print it to PDF.
3. On **Student progress**, back up and restore.
4. Check the browser console shows no errors.

## 5. Privacy

VADL sends nothing anywhere. Student work stays in each browser's LocalStorage under keys
beginning `vadl.v1.`. LocalStorage belongs to one address (scheme, host and port), so moving VADL
to a new address leaves students' saved work behind. Ask students to **Back up all my data**
before a move and restore it afterwards.

## 6. Updating

Build the new version and replace the folder contents. Stored student data carries a schema
version; a new version that changes stored data must include a migration
(`docs/guides/maintainer-guide.md` §4).
