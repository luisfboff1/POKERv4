const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://poker.luisfboff.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/poker/api'
      }
    })
  );
};
