import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import del from 'del';
import babelCompiler from 'babel-core/register';
import * as isparta from 'isparta';
import babel from 'gulp-babel';
const plugins = gulpLoadPlugins();
const paths = {
  js: ['./**/*.js', '!dist/**', '!public/**', '!node_modules/**', '!coverage/**'],
  nonJs: ['./package.json', './**/*.ejs'],
  tests: './server/tests/*.js'
};
gulp.task('copy', () =>
  gulp.src(paths.nonJs, { allowEmpty: true })
    .pipe(plugins.newer('dist'))
    .pipe(gulp.dest('dist')));
const options = {
  codeCoverage: {
    reporters: ['lcov', 'text-summary'],
    thresholds: {
      global: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50
      }
    }
  }
};
// Clean up dist and coverage directory
gulp.task('clean', () => del(['dist/**', 'coverage/**', '!dist', '!coverage', '!dist/uploads/**']));
// Set env variables
gulp.task('set-env', () => {
  plugins.env({
    vars: {
      NODE_ENV: 'test'
    }
  });
});
gulp.task('set-env-staging', () => {
  plugins.env({
    vars: {
      NODE_ENV: 'staging'
    }
  });
});
gulp.task('set-env-development', () => {
  plugins.env({
    vars: {
      NODE_ENV: 'development'
    }
  });
});
// Lint Javascript
gulp.task('lint', () =>
  gulp.src(paths.js)
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(plugins.eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(plugins.eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(plugins.eslint.failAfterError()));
// Compile ES6 to ES5 and copy to dist
gulp.task('babel', () =>
  gulp.src([...paths.js, '!gulpfile.babel.js'], { base: '.' })
    .pipe(plugins.newer('dist'))
    .pipe(plugins.sourcemaps.init())
    .pipe(babel())
    .pipe(plugins.sourcemaps.write('.', {
      includeContent: false,
      sourceRoot(file) {
        return path.relative(file.path, __dirname);
      }
    }))
    .pipe(gulp.dest('dist')));
// Start server with restart on file changes
gulp.task('nodemon', gulp.series('copy', 'babel', () =>
  plugins.nodemon({
    script: path.join('dist', 'index.js'),
    ext: 'js',
    ignore: ['node_modules/**/*.js', 'dist/**/*.js'],
    tasks: ['copy', 'babel']
  })));
// covers files for code coverage
gulp.task('pre-test', () =>
  gulp.src([...paths.js, '!gulpfile.babel.js'])
    // Covering files
    .pipe(plugins.istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }))
    // Force `require` to return covered files
    .pipe(plugins.istanbul.hookRequire()));
// triggers mocha test with code coverage
gulp.task('test', gulp.series('pre-test', 'set-env', () => {
  let exitCode = 0;
  const reporters = [
    ...options.codeCoverage.reporters
  ].concat(plugins.util.env['code-coverage-reporter']
    ? [plugins.util.env['code-coverage-reporter']]
    : []);
  return gulp.src([paths.tests], { read: false })
    .pipe(plugins.plumber())
    .pipe(plugins.mocha({
      reporter: plugins.util.env['mocha-reporter'] || 'spec',
      ui: 'bdd',
      timeout: 11000,
      compilers: {
        js: babelCompiler
      }
    }))
    .once('error', (err) => {
      plugins.util.log(err);
      exitCode = 1;
    })
    // Creating the reports after execution of test cases
    .pipe(plugins.istanbul.writeReports({
      dir: './coverage',
      reporters
    }))
    // Enforce test coverage
    .pipe(plugins.istanbul.enforceThresholds({
      thresholds: options.codeCoverage.thresholds
    }))
    .once('end', () => {
      plugins.util.log('completed !!');
      process.exit(exitCode);
    });
}));
// clean dist, compile js files, copy non-js files and execute tests
gulp.task('mocha', gulp.series ('clean', gulp.parallel('copy', 'babel'), 'test'));
// gulp serve for development
gulp.task('serve-staging', gulp.series('set-env-staging', 'clean', 'nodemon'));
gulp.task('serve-development', gulp.series('set-env-development', 'clean', 'nodemon'));
// gulp serve for development
gulp.task('serve', gulp.series('clean', 'nodemon'));
// default task: clean dist, compile js files and copy non-js files.
gulp.task('default', gulp.series('clean', gulp.parallel('copy', 'babel')));