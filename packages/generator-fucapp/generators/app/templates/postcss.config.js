module.exports = {
  plugins: {
    autoprefixer: {},
    'postcss-pxtorem': {
      rootValue: 32,
      propList: ['*'],
      // 白名单，匹配则不处理对应class下的样式，用于适配node_modules中的模块
      selectorBlackList: ['weui-'],
      // 忽略1px
      minPixelValue: 2,
    },
  },
};
