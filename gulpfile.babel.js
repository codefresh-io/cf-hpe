import gulp from 'gulp';
import eslint from 'gulp-eslint';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import bump from 'gulp-bump';
import runSequence from 'run-sequence';
import del from 'del';

gulp.task('watch', () => {
  gulp.watch(['src/**/*.js'], ['build']);
});

gulp.task('lint', () =>
  gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('test', ['lint'], () =>
  gulp.src(['test/**/*.test.js'], { read: false })
    .pipe(mocha()));

gulp.task('bump-version', () => {
  gulp.src(['./package.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

gulp.task('clean', () =>
  del(['dist']));

gulp.task('build', () =>
  gulp.src(['src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('dist')));

gulp.task('release', callback => {
  runSequence(
    'bump-version',
    'clean',
    'build',
    callback);
});
