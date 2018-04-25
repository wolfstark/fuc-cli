'use strict';

module.exports = [
  {
    type: 'confirm',
    name: 'autoprefix',
    message: 'Enable CSS autoprefixer?',
    default: true
  },
  {
    type: 'list',
    name: 'styleSyntax',
    message: 'Which syntax do you want to write your stylesheet',
    choices: [
      {
        name: 'CSS',
        value: 'css'
      },
      {
        name: 'LESS',
        value: 'less'
      },
      {
        name: 'SCSS',
        value: 'scss'
      }
    ],
    default: 0
  },
  {
    type: 'checkbox',
    name: 'styleLibs',
    message:
      'Which thirdparty stylesheet(s) would your project needs(import with <link> tag by html document)',
    choices: [
      {
        name: 'BootStrap',
        value: '//cdn.bootcss.com/bootstrap/3.3.7/css/bootstrap.min.css'
      }
    ]
  },
  {
    type: 'confirm',
    name: 'enableSprites',
    message: 'Enable CSS Sprites?',
    default: true
  }
];
