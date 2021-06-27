module.exports = {
  baseUrl: '/auto-deploy/',

  deploy: process.env.DEPLOY_ENV === 'prod' ? {
    host: 'v0.ftp.upyun.com',
    user: 'xxx/xxx',
    password: 'xxx',
    ftpDomain: 'https://wenxi.tech',
  } : {
    host: 'v0.ftp.upyun.com',
    user: 'xxx/xxx',
    password: 'xxx',
    ftpDomain: 'https://wenxi.tech',
  },
};
