/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // publicPath: "/build/",
  // serverBuildPath: "build/index.js",
  future: {
    v2_dev: true,
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
  },
  headers: ({ loaderHeaders, parentHeaders, actionHeaders, errorHeaders }) => {
    let headers = new Headers();
    if (errorHeaders) {
      for (let [key, value] of errorHeaders.entries()) {
        headers.append(key, value);
      }
    }
    if (actionHeaders) {
      for (let [key, value] of actionHeaders.entries()) {
        headers.append(key, value);
      }
    }
    if (loaderHeaders) {
      for (let [key, value] of loaderHeaders.entries()) {
        headers.append(key, value);
      }
    }
    if (parentHeaders) {
      for (let [key, value] of parentHeaders.entries()) {
        headers.append(key, value);
      }
    }
    headers.append('Cache-Control', 'public, max-age=31536000, immutable');
    return headers;
  }
}; 