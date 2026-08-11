module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'init',
      ],
    ],
    'subject-case': [0],
    'body-empty': [2, 'never'],
    'body-leading-blank': [2, 'always'],
  },
};
