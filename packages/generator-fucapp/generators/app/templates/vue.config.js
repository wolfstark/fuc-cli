module.exports = {
  baseUrl: '/auto-deploy/',

  deploy: process.env.DEPLOY_ENV === 'prod' ? {
    host: 'v0.ftp.upyun.com',
    user: 'ultimavipweb/static-ultimavip',
    password: 'anve101310112',
    ftpDomain: 'https://static.ultimavip.cn',
  } : {
    host: 'v0.ftp.upyun.com',
    user: 'xiaobai/testultimavipweb',
    password: 'xiaobai123',
    ftpDomain: 'http://testweb.ultimavip.cn',
  },
};
