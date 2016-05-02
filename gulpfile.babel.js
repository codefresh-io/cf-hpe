import gulp from 'gulp';
import eslint from 'gulp-eslint';
import mocha from 'gulp-mocha';
import processEnv from 'gulp-process-env';

gulp.task('default', ['lint'], () => {

});

gulp.task('lint', () =>
  gulp.src(['**/*.js', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError()));

gulp.task('test', ['lint', 'unit-test', 'integration-test']);

gulp.task('unit-test', () =>
  gulp.src(['test/unit-*.js'], { read: false })
    .pipe(mocha({ reporter: 'spec' })));

gulp.task('integration-test', () =>
  gulp.src(['test/integration-*.js'], { read: false })
    .pipe(processEnv({
      HPE_SERVER_URL: 'http://146.148.93.246:8080',
      HPE_USER: 'cf_p32zor9g9gl2zbp0rp663oex0',
      HPE_PASSWORD: '=211cb1cdb045df37I',
      HPE_SHARED_SPACE: '1001',
      HPE_WORKSPACE: '1002',
    }))
    .pipe(mocha({ reporter: 'spec' })));

