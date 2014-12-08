'use strict';
// Gulpfile
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

gulp.task('styles', function () {
  return gulp.src('./src/styles/app.scss')
    .pipe($.plumber())
    .pipe($.rubySass({
          style: 'expanded'
        }))
    .pipe($.autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(gulp.dest('./.tmp/styles'));
});

gulp.task('include', function() {
  return gulp.src([
      './src/**/*.html',
      '!src/partials/*.html'
    ])
    .pipe($.fileInclude({ prefix: '@@', basepath: '@file' }))
    .pipe(gulp.dest('.tmp/'));
});

gulp.task('html', ['styles'], function () {
  var assets = $.useref.assets({searchPath: '{.tmp,src}'});

  return gulp.src('./src/*.html')
    .pipe(assets)
    .pipe($.if('*.css', $.csso()))
    .pipe($.if('*.js', $.uglify()))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe(gulp.dest('./dist'));
});

gulp.task('images', function () {
  return gulp.src('.src/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('./dist/images'));
});

gulp.task('fonts', function () {
  return gulp.src(require('main-bower-files')().concat('src/fonts/**/*'))
    .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
    .pipe($.flatten())
    .pipe(gulp.dest('dist/fonts'));
});


gulp.task('bower', function() { 
    return $.bower()
         .pipe(gulp.dest(config.bowerDir)) 
});

// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('./src/styles/*.scss')
    .pipe(wiredep())
    .pipe(gulp.dest('./src/styles'));

  gulp.src('./src/*.html')
    .pipe(wiredep())
    .pipe(gulp.dest('./src'));
});

gulp.task('clean', require('del').bind(null, ['.tmp', 'dist']));

gulp.task('connect', ['styles'], function () {
  var serveStatic = require('serve-static');
  var serveIndex = require('serve-index');
  var app = require('connect')()
    .use(require('connect-livereload')({port: 35729}))
    .use(serveStatic('.tmp'))
    .use(serveStatic('src'))
    // paths to bower_components should be relative to the current file
    // e.g. in app/index.html you should use ../bower_components
    .use('/bower_components', serveStatic('bower_components'))
    .use(serveIndex('src'));

  require('http').createServer(app)
    .listen(9000)
    .on('listening', function () {
      console.log('Started connect web server on http://localhost:9000');
    });
});

gulp.task('server', ['include','connect', 'watch'], function () {
  require('opn')('http://localhost:9000')
});

gulp.task('watch', ['connect'], function () {
  $.livereload.listen();

  // watch for changes
  gulp.watch([
    './src/**/*.html',
    '.tmp/styles/**/*.css',
    '.tmp/*.html',
    './src/scripts/**/*.js',
    './src/images/**/*'
  ]).on('change', $.livereload.changed);

  gulp.watch('./src/styles/**/*.scss', ['styles']);
  gulp.watch('./src/**/*.html', ['include']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('build', ['html', 'fonts', 'images'], function () {
  return gulp.src('./dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
