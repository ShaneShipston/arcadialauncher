const gulp = require('gulp');
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const minifycss = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const watch = require('gulp-watch');
const sync = require('browser-sync').create();

const config = {
    url: 'arcadia.local',
    port: 3000,
    src: {
        img: 'src/img/**/*.{png,jpg,gif}',
        css: 'src/scss/**/*.scss',
    },
    dest: {
        img: 'images',
        css: 'stylesheets',
    },
};

// --- [DEV TASKS] ---

gulp.task('sync', () => {
    sync.init({
        proxy: config.url,
        port: config.port,
        ui: false,
        online: true,
        logPrefix: 'Arcadia',
        open: false,
    });
});

gulp.task('watch', () => {
    // CSS
    watch(config.src.css, () => {
        gulp.start('styles');
    });

    // Images
    watch(config.src.img, { events: ['add'], readDelay: 500 })
        .pipe(imagemin())
        .pipe(gulp.dest(config.dest.img));
});

gulp.task('styles', () => {
    gulp.src(config.src.css)
        .pipe(sass({
            outputStyle: 'compressed',
        }).on('error', sass.logError))
        .pipe(prefix({
            cascade: false,
        }))
        .pipe(gulp.dest(config.dest.css))
        .pipe(sync.stream({
            match: '**/*.css',
        }));
});

gulp.task('images', () => {
    gulp.src(config.src.img)
        .pipe(imagemin())
        .pipe(gulp.dest(config.dest.img));
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

gulp.task('default', ['styles', 'images', 'watch']);
