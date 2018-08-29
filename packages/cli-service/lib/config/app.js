// config that are specific to --target app
const globby = require('globby');
const mustache = require('mustache');
const path = require('path');
const fs = require('fs');
const dirExists = require('../util/fsHelper');


function ensureRelative(outputDir, _path) {
  if (path.isAbsolute(_path)) {
    return path.relative(outputDir, _path);
  }
  return _path;
}

module.exports = (api, options) => {
  const entryTplPath = path.join(__dirname, '../../temp', 'entry.js.tpl');
  const entryTpl = fs.readFileSync(entryTplPath, 'utf-8');

  function getPagesPath(_path) {
    return path.join(api.resolve('.'), './node_modules/.entries', _path);
  }

  // mustache.render();
  function generatorEntry(routeConfig = []) {
    const pages = {};


    routeConfig.forEach((route) => {
      const res = mustache.render(entryTpl, route);
      const entry = getPagesPath(`${route.key}/index.js`);
      // fs.openSync(entry, 'w+');
      // console.log('文件创建成功！');
      dirExists(path.parse(entry).dir);
      fs.writeFileSync(entry, res, 'utf-8');
      pages[route.key] = entry;
    });
    return pages;
  }

  api.chainWebpack((webpackConfig) => {
    const isProd = process.env.NODE_ENV === 'production';
    const isLegacyBundle = process.env.VUE_CLI_MODERN_MODE && !process.env.VUE_CLI_MODERN_BUILD;
    const outputDir = api.resolve(options.outputDir);

    // code splitting
    if (isProd) {
      webpackConfig
        .optimization.splitChunks({
          cacheGroups: {
            vendors: {
              name: 'chunk-vendors',
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              chunks: 'initial',
            },
            common: {
              name: 'chunk-common',
              minChunks: 2,
              priority: -20,
              chunks: 'initial',
              reuseExistingChunk: true,
            },
          },
        });
    }

    // HTML plugin
    const resolveClientEnv = require('../util/resolveClientEnv');

    // #1669 html-webpack-plugin's default sort uses toposort which cannot
    // handle cyclic deps in certain cases. Monkey patch it to handle the case
    // before we can upgrade to its 4.0 version (incompatible with preload atm)
    const chunkSorters = require('html-webpack-plugin/lib/chunksorter');
    const depSort = chunkSorters.dependency;
    chunkSorters.dependency = (chunks, ...args) => {
      try {
        return depSort(chunks, ...args);
      } catch (e) {
        // fallback to a manual sort if that happens...
        return chunks.sort((a, b) => {
          // make sure user entry is loaded last so user CSS can override
          // vendor CSS
          if (a.id === 'app') {
            return 1;
          } else if (b.id === 'app') {
            return -1;
          } else if (a.entry !== b.entry) {
            return b.entry ? -1 : 1;
          }
          return 0;
        });
      }
    };
    chunkSorters.auto = chunkSorters.dependency;

    const htmlOptions = {
      templateParameters: (compilation, assets, pluginOptions) => {
        // enhance html-webpack-plugin's built in template params
        let stats;
        return Object.assign({
          // make stats lazy as it is expensive
          get webpack() {
            stats = stats || compilation.getStats().toJson();
            return stats;
          },
          compilation,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            files: assets,
            options: pluginOptions,
          },
        }, resolveClientEnv(options, true /* raw */));
      },
    };


    if (isProd) {
      // handle indexPath
      if (options.indexPath !== 'index.html') {
        // why not set filename for html-webpack-plugin?
        // 1. It cannot handle absolute paths
        // 2. Relative paths causes incorrect SW manifest to be generated (#2007)
        webpackConfig
          .plugin('move-index')
          .use(require('../webpack/MovePlugin'), [
            path.resolve(outputDir, 'index.html'),
            path.resolve(outputDir, options.indexPath),
          ]);
      }

      Object.assign(htmlOptions, {
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          collapseBooleanAttributes: true,
          removeScriptTypeAttributes: true,
          // more options:
          // https://github.com/kangax/html-minifier#options-quick-reference
        },
      });

      // keep chunk ids stable so async chunks have consistent hash (#1916)
      const seen = new Set();
      const nameLength = 4;
      webpackConfig
        .plugin('named-chunks')
        .use(require('webpack/lib/NamedChunksPlugin'), [(chunk) => {
          if (chunk.name) {
            return chunk.name;
          }
          const modules = Array.from(chunk.modulesIterable);
          if (modules.length > 1) {
            const hash = require('hash-sum');
            const joinedHash = hash(modules.map(m => m.id).join('_'));
            let len = nameLength;
            while (seen.has(joinedHash.substr(0, len))) len += 1;
            seen.add(joinedHash.substr(0, len));
            return `chunk-${joinedHash.substr(0, len)}`;
          }
          return modules[0].id;
        }]);
    }
    /* 获取多页配置 */
    const routeConfig = globby.sync(['src/views/**/index.vue'], {
      cwd: api.resolve('.'),
    }).map(routePath => ({
      routePath: routePath.replace(/src\//, ''),
      key: routePath.replace(/(src\/views\/)|\/index\.vue/g, ''),
    }));

    // resolve HTML file(s)
    const HTMLPlugin = require('html-webpack-plugin');
    const PreloadPlugin = require('@vue/preload-webpack-plugin');
    const multiPageConfig = generatorEntry(routeConfig);
    const htmlPath = api.resolve('public/index.html');
    const defaultHtmlPath = path.resolve(__dirname, 'index-default.html');
    const publicCopyIgnore = ['index.html', '.DS_Store'];

    // console.log(multiPageConfig);
    // wran:当前总是多页
    if (!multiPageConfig) {
      // default, single page setup.
      htmlOptions.template = fs.existsSync(htmlPath) ?
        htmlPath :
        defaultHtmlPath;

      webpackConfig
        .plugin('html')
        .use(HTMLPlugin, [htmlOptions]);

      if (!isLegacyBundle) {
        // inject preload/prefetch to HTML
        webpackConfig
          .plugin('preload')
          .use(PreloadPlugin, [{
            rel: 'preload',
            include: 'initial',
            fileBlacklist: [/\.map$/, /hot-update\.js$/],
          }]);

        webpackConfig
          .plugin('prefetch')
          .use(PreloadPlugin, [{
            rel: 'prefetch',
            include: 'asyncChunks',
          }]);
      }
    } else {
      // multi-page setup
      webpackConfig.entryPoints.clear();

      const pages = Object.keys(multiPageConfig);
      const normalizePageConfig = c => (typeof c === 'string' ? {
        entry: c,
      } : c);

      pages.forEach((name) => {
        const {
          title,
          entry,
          template = `public/${name}.html`,
          filename = `${name}.html`,
          chunks,
        } = normalizePageConfig(multiPageConfig[name]);
        // inject entry
        webpackConfig.entry(name).add(api.resolve(entry));

        // resolve page index template
        const hasDedicatedTemplate = fs.existsSync(api.resolve(template));
        if (hasDedicatedTemplate) {
          publicCopyIgnore.push(template);
        }
        let templatePath;
        if (hasDedicatedTemplate) {
          templatePath = template;
        } else if (fs.existsSync(htmlPath)) {
          templatePath = htmlPath;
        } else {
          templatePath = defaultHtmlPath;
        }
        // inject html plugin for the page
        const pageHtmlOptions = Object.assign({}, htmlOptions, {
          chunks: chunks || ['chunk-vendors', 'chunk-common', name],
          template: templatePath,
          filename: ensureRelative(outputDir, filename),
          title,
        });

        webpackConfig
          .plugin(`html-${name}`)
          .use(HTMLPlugin, [pageHtmlOptions]);
      });

      if (!isLegacyBundle) {
        pages.forEach((name) => {
          const filename = ensureRelative(
            outputDir,
            normalizePageConfig(multiPageConfig[name]).filename || `${name}.html`,
          );
          webpackConfig
            .plugin(`preload-${name}`)
            .use(PreloadPlugin, [{
              rel: 'preload',
              includeHtmlNames: [filename],
              include: {
                type: 'initial',
                entries: [name],
              },
              fileBlacklist: [/\.map$/, /hot-update\.js$/],
            }]);

          webpackConfig
            .plugin(`prefetch-${name}`)
            .use(PreloadPlugin, [{
              rel: 'prefetch',
              includeHtmlNames: [filename],
              include: {
                type: 'asyncChunks',
                entries: [name],
              },
            }]);
        });
      }
    }

    if (options.crossorigin != null || options.integrity) {
      webpackConfig
        .plugin('cors')
        .use(require('../webpack/CorsPlugin'), [{
          crossorigin: options.crossorigin,
          integrity: options.integrity,
          baseUrl: options.baseUrl,
        }]);
    }

    // copy static assets in public/
    const publicDir = api.resolve('public');
    if (!isLegacyBundle && fs.existsSync(publicDir)) {
      webpackConfig
        .plugin('copy')
        .use(require('copy-webpack-plugin'), [
          [{
            from: publicDir,
            to: outputDir,
            ignore: publicCopyIgnore,
          }],
        ]);
    }
  });
};
