// if using own package.json: yarn add gulp gulp-autoprefixer browser-sync gulp-cache gulp-cssnano del gulp-if gulp-purifycss gulp-rename gulp-wait run-sequence gulp-sass gulp-twig gulp-uglify gulp-useref sass
(() => {

  'use strict';

  /**************** Gulp.js 4 configuration ****************/

  const

    // directory locations
    dir = {
      src         : 'src/',
      dist       : 'dist/'
    },

    // modules
    gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer')(),
    browserSync = require('browser-sync'),
    cache = require('gulp-cache'),
    cssnano = require('gulp-cssnano'),
    del = require('del'),
    gulpIf = require('gulp-if'),
    purify = require('gulp-purifycss'),
    rename = require("gulp-rename"),
    twig = require('gulp-twig'),
    uglify = require('gulp-uglify'),
    useref = require('gulp-useref'),
    wait = require('gulp-wait');

    var sass = require('gulp-sass')(require('sass'));

    // COPY
    // Copying fonts
    function fonts(done) {
      return gulp.src('src/fonts/**/*', { allowEmpty: true })
        .pipe(gulp.dest('dist/fonts'), done())
    }

    // Copy images
    function img(done) {
      return gulp.src('src/images/**/*.+(png|jpg|jpeg|gif|svg)', {allowEmpty: true})
        .pipe(gulp.dest('dist/images'), done())
    }

    // Copy favicon
    function favicon(done) {
      return gulp.src('src/favicon/*', {allowEmpty: true})
        .pipe(gulp.dest('dist/images/favicon'))
        done();
    }

    // Copying imported styles
    function copyImportedCss(done) {
      gulp.src('src/import-css/*', {allowEmpty: true})
        .pipe(gulpIf('*.scss', sass().on('error', sass.logError, done())))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('dist/css'))
        .pipe(cssnano({
            autoprefixer: false,
            calc: true,
            colormin: true,
            convertValues: true,
            core: true,
            discardComments: {removeAll: true},
            discardDuplicates: true,
            discardEmpty: true,
            discardUnused: true,
            discardOverridden: false,
            filterOptimiser: true,
            filterPlugins: false,
            functionOptimiser: false,
            mergeIdents: false,
            mergeLonghand: true,
            mergeRules: true,
            sourcemap: true,
            safe: true,
            zindex: false
          }
        ))
        .pipe(gulp.dest('dist/css'))
        done();
    }

    // Copying imported js
    function copyImportedJs(done) {
      gulp.src('src/import-js/*', {allowEmpty: true})
        .pipe(gulp.dest('dist/js'))
      done();
    }

    exports.copy = gulp.parallel(fonts, favicon, img, copyImportedCss, copyImportedJs);

    // STYLES
    // Sass
    function psass(done) {
      return gulp.src(['src/scss/*.scss', 'src/scss/*/*.scss'], {allowEmpty: true}) // Get all sass
        .pipe(wait(1000))
        .pipe(sass().on('error', sass.logError))// Sass to css, logs errors
        .pipe(autoprefixer) // Autoprefixer
        .pipe(gulp.dest('dist/css')),// Output in css folder
        done();
    }

    // CSSPurify
    function cssmin(done) {
      return gulp.src('./dist/css/style.css', {allowEmpty: true})
       .pipe(wait(500))
        .pipe(purify(['./dist/js/*.js', './dist/*.html'])) //purification - delete unused styles
        .pipe(rename({suffix: '.min'}))
        .pipe(cssnano({
            autoprefixer: true,
            calc: true,
            colormin: true,
            convertValues: true,
            core: true,
            discardComments: {removeAll: true},
            discardDuplicates: true,
            discardEmpty: true,
            discardUnused: true,
            discardOverridden: false,
            filterOptimiser: true,
            filterPlugins: false,
            functionOptimiser: false,
            mergeIdents: false,
            mergeLonghand: true,
            mergeRules: true,
            sourcemap: true,
            safe: true,
            zindex: false
          }
        )) 
        // Minification, some options turned off (considered dangerous)
        // see http://cssnano.co/optimisations/ for details
        .pipe(gulp.dest('./dist/css'))
        .pipe(browserSync.reload({ stream: true }), 
        done()
      );
    }

    exports.styles = gulp.series(psass, cssmin);

    // Scripts
    function js(done) {
      return gulp.src(['src/js/*.js', 'src/js/*/*.js'], {allowEmpty: true})
        .pipe(useref())
        .pipe(gulp.dest('dist/js'))
        .pipe(rename({suffix: '.min'}))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js')),
        done();
    }


    // Twigs
    function templates(done) {
      return gulp.src('src/templates/*.twig', {allowEmpty: true}) // run the Twig template parser on all .twig files in the "src" directory
        .pipe(wait(1000))
        .pipe(twig())
        .pipe(gulp.dest('dist/'),
        done()
        ); // output the rendered HTML files to the "dist" directory
    }

    // browser-sync
    function sync(done) {
      browserSync({
        server: {
          baseDir: 'dist'
        },
        socket: {
          domain: 'http://localhost:3000'
        }
      })
      done();
    }

    // Watchers
    function watcha(done) { 
      gulp.watch(['src/scss/*.scss', 'src/scss/*/*.scss', 'src/scss/**/*.scss'], gulp.series(psass, browserSync.reload)),
      gulp.watch(['src/templates/*.twig', 'src/templates/*/*.twig', 'src/templates/**/*.twig'], gulp.series(templates, browserSync.reload)),
      gulp.watch('src/js/**/*.js', gulp.series(js, browserSync.reload)),
      gulp.watch('dist/*', browserSync.reload),
      done();
    }

    // Cleaning
    function clean(done) {
      return del.sync('dist'), (function (cb) {
        return cache.clearAll(cb);
      }),
      done();
    }

    function cleanDistCached(done) {
      return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']),
      done();
    }

    exports.clean = gulp.parallel(clean, cleanDistCached) 

    // Sequences:
    exports.build = gulp.series(exports.clean, exports.copy, exports.styles, js, templates, );
    exports.default = gulp.series(exports.clean, exports.copy, exports.styles, js, templates, sync, watcha);
    exports.dev = gulp.series(cleanDistCached, exports.copy, exports.styles, js, templates, sync, watcha);

})();

// yarn run gulp 
