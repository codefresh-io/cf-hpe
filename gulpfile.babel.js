import gulp from 'gulp';
import eslint from 'gulp-eslint';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import bump from 'gulp-bump';
import processEnv from 'gulp-process-env';
import del from 'del';

const DIST_PATH = 'dist';

gulp.task('lint', () =>
  gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('test', ['lint'], () =>
  gulp.src(['test/**/*.spec.js'])
    .pipe(mocha()));

gulp.task('build', ['clean'], () =>
  gulp.src(['src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest(DIST_PATH)));

gulp.task('clean', () =>
  del([DIST_PATH]));

gulp.task('release', ['build'], () => {
  gulp.src(['./package.json'])
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

gulp.task('integration-test', ['test'], () =>
  gulp.src(['test/*e2e.js'], { read: false })
    .pipe(processEnv({
      HPE_SERVER_URL: 'http://146.148.93.246:8080',
      CF_HPE_USER: 'cf_p32zor9g9gl2zbp0rp663oex0',
      CF_HPE_PASSWORD: '=211cb1cdb045df37I',
      CF_HPE_SHARED_SPACE: '1001',
      CF_HPE_WORKSPACE: '1002',
    }))
    .pipe(mocha({ reporter: 'spec' })));

