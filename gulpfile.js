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

gulp.task('watch', () => {
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
});

gulp.task('styles', () => {
    gulp.src(config.src.css)
        .pipe(sass({
            outputStyle: 'compressed',
        }).on('error', sass.logError))
        .pipe(prefix({
            cascade: false,
        }))
        .pipe(minifycss())
        .pipe(gulp.dest(config.dest.css));
});

gulp.task('images', () => {
    gulp.src(config.src.img)
        .pipe(imagemin())
        .pipe(gulp.dest(config.dest.img));
});

gulp.task('javascript', (callback) => {
    webpack(webpackconfig, (err, stats) => {
        if (err) {
            throw new gutil.PluginError('webpack:build', err);
        }

        gutil.log('[webpack:build]', stats.toString({
            colors: true,
        }));

        callback();
    });
});

// --- [BUILD TASKS] ---

gulp.task('build', () => {
    gulp.src(config.src.css)
        .pipe(sass({
            outputStyle: 'compressed',
            errLogToConsole: true,
        }))
        .pipe(prefix({
            remove: false,
            cascade: false,
        }))
        .pipe(minifycss())
        .pipe(gulp.dest(config.dest.css));
});

gulp.task('init', ['styles', 'javascript']);
gulp.task('default', ['styles', 'images', 'javascript', 'watch']);
