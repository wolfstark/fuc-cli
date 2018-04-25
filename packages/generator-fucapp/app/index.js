'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const beautify = require('gulp-jsbeautifier');
const _ = require('lodash');
const Path = require('path');

const DEFAULT_APPNAME = 'fucapp';
module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    // Argument appname is not required
    this.argument('appname', {
      desc: 'project name',
      type: String,
      required: false
    });
    // Current选项代表是否在当前目录文件夹中创建项目
    this.option('current', {
      desc: 'generate app in current folder',
      type: Boolean,
      alias: 'c',
      required: false,
      default: false
    });
  }

  initializing() {
    // 美化输出文件格式
    this.registerTransformStream(beautify());
  }

  prompting() {
    this.log(yosay(`Welcome to the bedazzling ${chalk.red('generator-qwe')} generator!`));
    let prompts = [
      {
        type: 'list',
        name: 'templateType',
        message: 'Which template would you like to generate:',
        choices: [
          {
            name: 'Single Page Application',
            value: 'spa'
          },
          {
            name: 'Vue Application',
            value: 'vue'
          },
          {
            name: 'MultiPage Application',
            value: 'mpa'
          }
        ],
        default: 0
      }
    ];
    // 如果没有指定appname则提示用户输入
    if (!this.options.appname) {
      prompts.unshift({
        type: 'input',
        name: 'appname',
        message: "Input your project's name",
        default: DEFAULT_APPNAME,
        validate: name => {
          return !/\s+/.test(name.trim());
        }
      });
    }

    prompts = prompts
      .concat(require('./_prompts/_js.js'))
      .concat(require('./_prompts/_style.js'));

    return this.prompt(prompts).then(res => {
      let appname = res.appname || this.options.appname;
      let options = Object.assign({}, res, {
        appname
      });
      // Dependencies
      this.pkg = options.templateType === 'vue' ? ['vue', 'vue-template-compiler'] : [];
      // 渲染配置项
      this.renderOpts = options;
    });
  }

  writing() {
    this._renderTpl(this.renderOpts);
  }

  install() {
    if (this.pkg.length === 0) {
      return;
    }
    if (!this.options.current) {
      process.chdir(Path.join(process.cwd(), this.options.appname));
    }
    this._npmInstall(this.pkg);
    // This.installDependencies();
  }

  end() {}

  /**
   * @method
   * @private
   * @desc 根据用户配置将template模板render成对应的文件类型
   * @param  {Object} opts 用户配置项
   */
  _renderTpl(opts) {
    const DestFolder = this.options.current ? '' : Path.join(this.options.appname, '/');
    // 生成package.json文件
    this.fs.copyTpl(
      this.templatePath('package.ejs'),
      this.destinationPath(Path.join(DestFolder, 'package.json')),
      opts
    );
    // 生成boi-conf.js文件
    this.fs.copyTpl(
      this.templatePath('boi-conf.ejs'),
      this.destinationPath(Path.join(DestFolder, 'boi-conf.js')),
      opts
    );
    // 生成boi-mock.js文件
    this.fs.copyTpl(
      this.templatePath('boi-mock.js'),
      this.destinationPath(Path.join(DestFolder, 'boi-mock.js'))
    );
    // 复制图片
    this.fs.copy(
      this.templatePath('_assets/**/*'),
      this.destinationPath(Path.join(DestFolder, 'src', 'assets'))
    );
    // 复制gitignore配置文件
    this.fs.copy(
      this.templatePath('gitignore'),
      this.destinationPath(Path.join(DestFolder, '.gitignore'))
    );
    switch (opts.templateType) {
      case 'spa':
        this._renderTplOfSpa(DestFolder, opts);
        break;
      case 'mpa':
        this._renderTplOfMpa(DestFolder, opts);
        break;
      case 'vue':
        this._renderTplOfVue(DestFolder, opts);
        break;
      default:
    }
  }

  _renderTplOfMpa(dir, opts) {
    // 生成index.html文件
    this.fs.copyTpl(
      this.templatePath('mpa/index.ejs'),
      this.destinationPath(Path.join(dir, 'src', `index.html`)),
      opts
    );
    // 生成about.html文件
    this.fs.copyTpl(
      this.templatePath('mpa/index.about.ejs'),
      this.destinationPath(Path.join(dir, 'src', `index.about.html`)),
      opts
    );
    // 生成main.app.js文件
    this.fs.copyTpl(
      this.templatePath('mpa/_js/main.app.ejs'),
      this.destinationPath(Path.join(dir, 'src', 'js', `main.${opts.appname}.js`)),
      opts
    );
    // 生成main.about.js文件
    this.fs.copyTpl(
      this.templatePath('mpa/_js/main.about.ejs'),
      this.destinationPath(Path.join(dir, 'src', 'js', `main.about.js`)),
      opts
    );
    // 复制part文件
    this.fs.copy(
      this.templatePath('mpa/_js/part/**.js'),
      this.destinationPath(Path.join(dir, 'src', 'js/part'))
    );
    // 生成main.app.css文件
    this.fs.copyTpl(
      this.templatePath('mpa/_style/main.app.ejs'),
      this.destinationPath(
        Path.join(dir, 'src', 'style', `main.${opts.appname}.${opts.styleSyntax}`)
      ),
      opts
    );
    // 生成main.about.css文件
    this.fs.copyTpl(
      this.templatePath('mpa/_style/main.about.ejs'),
      this.destinationPath(
        Path.join(dir, 'src', 'style', `main.about.${opts.styleSyntax}`)
      ),
      opts
    );
  }

  _renderTplOfVue(dir, opts) {
    // 生成html文件
    this.fs.copyTpl(
      this.templatePath('vue/index.ejs'),
      this.destinationPath(Path.join(dir, 'src', `index.html`)),
      opts
    );
    // 生成js文件
    this.fs.copyTpl(
      this.templatePath('vue/_js/main.app.ejs'),
      this.destinationPath(Path.join(dir, 'src', 'js', `main.${opts.appname}.js`)),
      opts
    );
    // 生成vue文件
    this.fs.copyTpl(
      this.templatePath('vue/_js/App.vue.ejs'),
      this.destinationPath(Path.join(dir, 'src', 'js', `App.vue`)),
      opts
    );
    // 复制part文件
    this.fs.copy(
      this.templatePath('vue/_js/part/**.js'),
      this.destinationPath(Path.join(dir, 'src', 'js/part'))
    );
    // 生成style文件
    this.fs.copyTpl(
      this.templatePath('vue/_style/main.app.ejs'),
      this.destinationPath(
        Path.join(dir, 'src', 'style', `main.${opts.appname}.${opts.styleSyntax}`)
      ),
      opts
    );
  }

  _renderTplOfSpa(dir, opts) {
    // 生成html文件
    this.fs.copyTpl(
      this.templatePath('spa/index.ejs'),
      this.destinationPath(Path.join(dir, 'src', `index.html`)),
      opts
    );
    // 生成js文件
    this.fs.copyTpl(
      this.templatePath('spa/_js/main.app.ejs'),
      this.destinationPath(Path.join(dir, 'src', 'js', `main.${opts.appname}.js`)),
      opts
    );
    // 复制part文件
    this.fs.copy(
      this.templatePath('spa/_js/part/**.js'),
      this.destinationPath(Path.join(dir, 'src', 'js/part'))
    );
    // 生成style文件
    this.fs.copyTpl(
      this.templatePath('spa/_style/main.app.ejs'),
      this.destinationPath(
        Path.join(dir, 'src', 'style', `main.${opts.appname}.${opts.styleSyntax}`)
      ),
      opts
    );
  }

  /**
   * @method
   * @private
   * @desc 安装node模块
   * @param  {Array} modules 需安装的node模块数组
   */
  _npmInstall(modules) {
    if (modules && _.isArray(modules) && modules.length > 0) {
      this.npmInstall(modules, {
        'save-dev': true,
        skipMessage: true
      });
    }
  }
};
