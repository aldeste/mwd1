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
  // Image optimization,
  imagemin = require('gulp-imagemin'),
  // Save as mozjepeg, for jpg files
  imageminMozjpeg = require('imagemin-mozjpeg'),
  // Plumber, don't break my flow when I work
  plumber = require('gulp-plumber'),
  // Jade, HTML generator
  jade = require('gulp-jade'),
  // Parse JSON files, used with jade.
  data = require('gulp-data'),
  path = require('path'),
  fs = require('fs'),
  // only get changes
  changed = require('gulp-changed'),
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
    .pipe(changed('app/scss/', {extension: '.css'}))
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
    .pipe(imagemin({ multipass: true }))
    .pipe(rename({
      prefix: 'icon-'
    }))
    .pipe(svgmin())
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(gulp.dest('app/img/'));
});

// Images
gulp.task('media:pngs', function(tmp) {
    gulp.src(['app/img/src/**/*.png'])
      .pipe(plumber())
      .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
      .pipe(gulp.dest('app/img'));
});

gulp.task('media:jpeg', function(tmp) {
    gulp.src(['app/img/src/**/*.+(jpg|jpeg)'])
      .pipe(plumber())
      .pipe(imageminMozjpeg({quality: 80})())
      .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
      .pipe(gulp.dest('app/img'));
});

// HTMLs
gulp.task('template', function() {
  return gulp
    .src('./app/jade/*.jade')
    .pipe(plumber())
    .pipe(data(function(file) {
      return JSON.parse(fs.readFileSync('./app/jade/data.json'));
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
  var img = gulp.src('app/img/**/*.+(png|jpg|jpeg|gif|svg)')
    .pipe(gulp.dest('dist/img'))
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
