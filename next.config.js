// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "connect-src 'self' http://localhost:3002 https://localhost:3002; " +
              "default-src 'self'; " +
              "img-src 'self' data:; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // <--- Add 'unsafe-eval'
              "style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
