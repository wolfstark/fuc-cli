'use strict';

module.exports = [
  {
    type: 'checkbox',
    name: 'jsLibs',
    message:
      'Which thirdparty lib(s) would your project needs(import with <script> tag by html document)',
    choices: [
      {
        name: 'jQuery 1.10.1',
        value: '//cdn.bootcss.com/jquery/1.10.1/jquery.min.js'
      },
      {
        name: 'BootStrap',
        value: '//cdn.bootcss.com/bootstrap/3.3.7/js/bootstrap.min.js'
      }
    ]
  }
];
