const gulp = require('gulp');

const sources = {
  typescript: 'src/**/*.{j,t}s{,x}',
};
const sourcemaps = true;

exports['transpile:tsc'] = function tsc() {
  const ts = require('gulp-typescript');
  return gulp.src(sources.typescript, { sourcemaps })
    .pipe(ts.createProject('tsconfig.json')())
    .pipe(gulp.dest('dist', { sourcemaps } ));
}

exports['lint:tslint'] = function tslint() {
  const tslint = require('gulp-tslint');
  return gulp.src(sources.typescript)
    .pipe(tslint())
    .pipe(tslint.report());
}

exports['test:mocha'] = function mocha() {
  const mocha = require('gulp-mocha-thin');
  return gulp.src('./test/**/*.spec.{j,t}s')
    .pipe(mocha());
}

exports['watch:typescript'] = function watchTypeScript() {
  const task = gulp.parallel(exports['transpile:tsc'], exports['lint:tslint']);
  return gulp.watch(sources.typescript, task);
}

exports.transpile = gulp.parallel(exports['transpile:tsc']);
exports.lint = gulp.parallel(exports['lint:tslint']);
exports.build = gulp.parallel(exports.transpile);
exports.default = exports.build;
exports.test = gulp.parallel(exports['test:mocha']);
exports.watch = gulp.parallel(exports['watch:typescript']);
