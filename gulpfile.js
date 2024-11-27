const gulp = require('gulp');
const browserSync = require('browser-sync');
const htmlmin = require('gulp-htmlmin');

gulp.task('serve', function() {
    browserSync.init({
        server: {baseDir: 'dist'}
    });
    gulp.watch("src/*.html").on('change', browserSync.reload);
})

gulp.task('checker', function() {
    gulp.watch("src/*.html").on('change', gulp.parallel('html-minimizer'));
});

gulp.task('html-minimizer', function() { // minimize the html files
    return gulp.src('src/*.html') // get any html file from the src directory
        .pipe(htmlmin({collapseWhitespace : true}))
        .pipe(gulp.dest('dist'))
});

gulp.task('scripts-mover', function() { // move js files.
    return gulp.src('src/js/scripts/*.js') // get the js files from src
        .pipe(gulp.dest('dist/js/scripts'))
});

gulp.task("default", gulp.parallel(
    'serve',
    'checker',
    'html-minimizer',
    'scripts-mover'
));
