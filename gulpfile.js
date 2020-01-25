const gulp = require('gulp');

function spawn(command, args = [], options) {
  const child = require('child_process')
    .spawn(command, args.filter(e => e === 0 || e), options);
  if (child.stdout) child.stdout.pipe(process.stdout);
  if (child.stderr) child.stderr.pipe(process.stderr);
  return child;
}

const sources = {
  typescript: 'src/**/*.{j,t}s{,x}',
};
const sourcemaps = true;

exports['transpile:tsc'] = function tsc() {
  const options = ['--pretty', sourcemaps ? '--sourceMap' : undefined];
  return spawn('tsc', options);
}

exports['lint:eslint'] = function tslint() {
  const options = ['.', '--ext', '.js,.jsx,.ts,.tsx']
    .concat(process.env.CI ? ['-f', 'junit', '-o', './reports/eslint/test-results.xml'] : []);
  return spawn('eslint', options);
}

exports['test:mocha'] = function mocha() {
  const options = process.env.CI
    ? ['-R', 'xunit', '-O', 'output=./reports/mocha/test-results.xml']
    : ['-c'];
  return spawn('mocha', options);
}

exports['watch:typescript'] = function watchTypeScript() {
  const task = gulp.parallel(exports['transpile:tsc'], exports['lint:tslint']);
  return gulp.watch(sources.typescript, task);
}

exports.transpile = gulp.parallel(exports['transpile:tsc']);
exports.lint = gulp.parallel(exports['lint:eslint']);
exports.build = gulp.parallel(exports.transpile);
exports.default = exports.build;
exports.test = gulp.parallel(exports['test:mocha']);
exports.watch = gulp.parallel(exports['watch:typescript']);
