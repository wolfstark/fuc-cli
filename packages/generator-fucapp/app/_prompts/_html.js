'use strict';

module.exports = [
  {
    type: 'list',
    name: 'htmlEngine',
    message: 'Which engine would you like to render your view',
    choices: [
      {
        name: 'Html',
        value: 'html'
      },
      {
        name: 'Ejs',
        value: 'ejs'
      },
      {
        name: 'Pug',
        value: 'pug'
      },
      {
        name: 'Mustache',
        value: 'mustache'
      }
    ],
    default: 0
  }
];
