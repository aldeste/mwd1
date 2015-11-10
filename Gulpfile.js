'use strict';

var gulp = require('gulp'),
  // Sass.
  sass = require('gulp-sass'),
  // PostCss used to fix and optimize rendered css file
  postcss = require('gulp-postcss'),
  // Makes maps
  sourcemaps = require('gulp-sourcemaps'),
  // Rename file before output, used to name .min file
  rename = require('gulp-rename'),
  // Minify CSS, Post-css plugin.
  csswring = require('csswring'),
  // Truncate z-index values to lowest possible, keeping
  // the z-index hierarchy across css file. Post-css plugin.
  zindex = require('postcss-zindex'),
  // Removes unused fonts from css. Post-css plugin.
  discardfontface = require('postcss-discard-font-face'),
  // If two rules are similar and follows each other, merge them.
  // Post-css plugin.
  mergerules = require('postcss-merge-rules'),
  // Merges similar media queries, so for instance
  // all min-width defenitions end up in the same
  // media query. Post-css plugin.
  mqpacker = require('css-mqpacker'),
  // Prefixes everything. Post-css plugin.
  autoprefixer = require('autoprefixer'),
  // Refresh browser on cue.
  browserSync = require('browser-sync'),
  // SVG fixers
  svgstore = require('gulp-svgstore'),
  svgmin = require('gulp-svgmin'),
  // Plumber, don't break my flow when I work
  plumber = require('gulp-plumber'),
  // Jade, HTML generator
  jade = require('gulp-jade'),
  // Parse JSON files, used with jade.
  data = require('gulp-data'),
  path = require('path'),
  fs = require('fs'),
  // merge-stream, output multilple tasks to multiple destinations
  merge = require('merge-stream');


// Reload on filechange
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app'
    }
  });
});

// Styles
gulp.task('styles:default', function() {
  var processors = [
    autoprefixer({
      browsers: ['last 3 version']
    }),
    mqpacker({
      sort: true
    }),
    discardfontface,
    mergerules,
    zindex
  ];

  return gulp.src('app/scss/style.scss')
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('styles:dist', function() {
  var dist_processors = [
    csswring({
      removeAllComments: true
    })
  ];

  return gulp.src('app/css/style.scss')
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(postcss(dist_processors))
    .pipe(gulp.dest('app/css'));
});

// SVGs
gulp.task('svg', function() {
  return gulp
    .src('app/svg/*.svg')
    .pipe(rename({
      prefix: 'icon-'
    }))
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(gulp.dest('app/img/'));
});

// HTMLs
gulp.task('template', function() {
  return gulp
    .src('./app/jade/**/*.jade')
    .pipe(plumber())
    .pipe(data(function(file) {
      return JSON.parse(fs.readFileSync('./app/jade/' + path.basename(file.path) + '.json'));
    }))
    .pipe(jade({pretty: true}))
    .pipe(gulp.dest('./app/'))
});

// Send production files ahead.
gulp.task('prod', function() {
  var html = gulp.src('app/*.html')
    .pipe(gulp.dest('dist'))
  var css = gulp.src('app/css/*.css')
    .pipe(gulp.dest('dist/css'))
  var img = gulp.src('app/images/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(gulp.dest('dist/images'))
  var js = gulp.src('app/js/*.js')
    .pipe(gulp.dest('dist/js'))

  return merge(html, css, img, js);
});

// Watch
gulp.task('watch', ['browserSync', 'styles:default', 'template'], function() {
  gulp.watch('./app/scss/**/*.scss', ['styles:default']);
  gulp.watch('./app/jade/**/*.+(jade|json)', ['template']);
  gulp.watch('./app/index.html', browserSync.reload);
});

// Default gulp task
gulp.task('default', ['styles:default', 'template', 'watch']);
