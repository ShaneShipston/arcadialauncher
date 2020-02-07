const gulp = require('gulp');
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const minifycss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const webpackconfig = Object.create(require('./webpack.config.js'));
const webpack = require('webpack');
const gutil = require('gulp-util');

const config = {
    src: {
        img: 'src/img/**/*.{png,jpg,gif}',
        js: 'src/js/**/*.js',
        css: 'src/scss/**/*.scss',
    },
    dest: {
        img: 'images',
        js: 'javascripts/renderer/',
        css: 'stylesheets',
    },
};

function monitor(cb) {
    // CSS
    watch(config.src.css, () => {
        gulp.start('styles');
    });

    // Images
    watch(config.src.img, { events: ['add'], readDelay: 500 })
        .pipe(imagemin())
        .pipe(gulp.dest(config.dest.img));

    // JS
    watch(config.src.js, () => {
        gulp.start('javascript');
    });

    cb();
}

function styles() {
    return gulp.src(config.src.css)
        .pipe(sass({
            outputStyle: 'compressed',
        }).on('error', sass.logError))
        .pipe(prefix({
            cascade: false,
        }))
        .pipe(minifycss())
        .pipe(gulp.dest(config.dest.css));
}

function images() {
    return gulp.src(config.src.img)
        .pipe(imagemin())
        .pipe(gulp.dest(config.dest.img));
}

function javascript(cb) {
    webpack(webpackconfig, (err, stats) => {
        if (err) {
            throw new gutil.PluginError('webpack:build', err);
        }

        gutil.log('[webpack:build]', stats.toString({
            colors: true,
        }));

        cb();
    });
}

exports.init = gulp.series(styles, javascript);
exports.default = gulp.series(styles, images, javascript, monitor);
