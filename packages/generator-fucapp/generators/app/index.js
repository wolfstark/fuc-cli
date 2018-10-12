const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const beautify = require('gulp-jsbeautifier');
// const _ = require('lodash');
const Path = require('path');
const shell = require('shelljs');

const DEFAULT_APPNAME = 'fucapp';
module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    // Argument appname is not required
    this.argument('appname', {
      desc: 'project name',
      type: String,
      required: false,
    });
    // Current选项代表是否在当前目录文件夹中创建项目
    this.option('current', {
      desc: 'generate app in current folder',
      type: Boolean,
      alias: 'c',
      required: false,
      default: false,
    });
  }

  initializing() {
    // 美化输出文件格式
    this.registerTransformStream(beautify());
  }

  prompting() {
    this.log(yosay(`Welcome to the bedazzling ${chalk.red('generator-fucapp')} generator!`));
    const prompts = [];
    // 如果没有指定appname则提示用户输入
    if (!this.options.appname) {
      prompts.unshift({
        type: 'input',
        name: 'appname',
        message: "Input your project's name",
        default: DEFAULT_APPNAME,
        validate: name => !/\s+/.test(name.trim()),
      });
    }

    return this.prompt(prompts).then((res) => {
      const appname = res.appname || this.options.appname;
      const options = Object.assign({}, res, {
        appname,
      });

      this.renderOpts = options;
    });
  }

  writing() {
    this._renderTpl(this.renderOpts);
  }
  install() {
    if (!this.options.current) {
      process.chdir(Path.join(process.cwd(), this.options.appname));
    }
    this.yarnInstall().then(() => {
      shell.exec('yarn lint');
      shell.exec('git init');
      shell.exec('git add .');
      shell.exec('git commit -m "init"', {
        silent: true,
      });
      this.log('The installation is complete!');
    });
  }
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
      this.templatePath('**/*'),
      this.destinationPath(Path.join(DestFolder, '')),
      opts,
    );
    this.fs.copyTpl(
      this.templatePath('.browserslistrc'),
      this.destinationPath(Path.join(DestFolder, '.browserslistrc')),
    );
    this.fs.copyTpl(
      this.templatePath('.eslintrc.js'),
      this.destinationPath(Path.join(DestFolder, '.eslintrc.js')),
    );
    this.fs.copyTpl(
      this.templatePath('.gitignore.tpl'),
      this.destinationPath(Path.join(DestFolder, '.gitignore')),
    );
    this.fs.copyTpl(
      this.templatePath('.env.dev.yml'),
      this.destinationPath(Path.join(DestFolder, '.env.dev.yml')),
    );
    this.fs.copyTpl(
      this.templatePath('.env.prod.yml'),
      this.destinationPath(Path.join(DestFolder, '.env.prod.yml')),
    );
    this.fs.copyTpl(
      this.templatePath('.env.test.yml'),
      this.destinationPath(Path.join(DestFolder, '.env.test.yml')),
    );
  }
};
