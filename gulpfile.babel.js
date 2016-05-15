import gulp from 'gulp';
import eslint from 'gulp-eslint';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import bump from 'gulp-bump';
import del from 'del';

const DIST_PATH = 'dist';

gulp.task('lint', () =>
  gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('test', ['lint'], () =>
  gulp.src(['test/**/*.unit.js'])
    .pipe(mocha()));

gulp.task('clean', () =>
  del([DIST_PATH]));

gulp.task('build', ['clean'], () =>
  gulp.src(['src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest(DIST_PATH)));

gulp.task('release', ['build'], () => {
  gulp.src(['./package.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});
