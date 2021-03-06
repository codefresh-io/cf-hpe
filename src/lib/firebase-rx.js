import R from 'ramda';
import Rx from 'rx';
import FirebaseTokenGenerator from 'firebase-token-generator';

export const FirebaseRx = {};
export const FirebaseSnapshotRx = {};

FirebaseRx.of = (ref) => Rx.Observable.just(ref);
FirebaseRx.root = (ref) => ref.root();
FirebaseRx.unauth = (ref) => ref.unauth();
FirebaseRx.child = R.curry((path, ref) => ref.child(path));
FirebaseRx.push = R.curry((value, ref) => Rx.Observable.fromPromise(ref.push(value)));
FirebaseRx.set = R.curry((value, ref) => Rx.Observable.fromPromise(ref.set(value)));
FirebaseRx.update = R.curry((value, ref) => Rx.Observable.fromPromise(ref.update(value)));
FirebaseRx.remove = (ref) => Rx.Observable.fromPromise(ref.remove());

FirebaseSnapshotRx.val = (snapshot) => snapshot.val();
FirebaseSnapshotRx.exists = (snapshot) => snapshot.exists();
FirebaseSnapshotRx.prop = R.curry((name, ref) => R.prop(name, ref.val()));

FirebaseRx.authWithSecretToken = R.curry((secret, uid, options, ref) =>
  Rx.Observable
    .just(new FirebaseTokenGenerator(secret))
    .map(tokenGenerator => tokenGenerator.createToken({ uid }, options))
    .flatMap(authToken => ref.authWithCustomToken(authToken))
    .map(R.identity(ref)));

FirebaseRx.on = R.curry((eventType, ref) =>
  Rx.Observable.create(observer => {
    const onHandler = ref.on(
      eventType,
      value => observer.onNext(value),
      error => observer.onError(error));

    return Rx.Disposable.create(() => {
      ref.off(eventType, onHandler);
    });
  }));

FirebaseRx.once = R.curry((eventType, ref) =>
  Rx.Observable.create(observer => {
    ref.once(
      eventType,
      snapshot => {
        observer.onNext(snapshot);
        observer.onCompleted();
      },
      error => observer.onError(error));
  }));

FirebaseRx.onValue = FirebaseRx.on('value');
FirebaseRx.onChildAdded = FirebaseRx.on('child_added');
FirebaseRx.onChildRemoved = FirebaseRx.on('child_removed');
FirebaseRx.onChildChanged = FirebaseRx.on('child_changed');

FirebaseRx.onceValue = FirebaseRx.once('value');
FirebaseRx.onceChildAdded = FirebaseRx.once('child_added');
FirebaseRx.onceChildRemoved = FirebaseRx.once('child_removed');
FirebaseRx.onceChildChanged = FirebaseRx.once('child_changed');

FirebaseRx.onConnected = R.pipe(
  FirebaseRx.root,
  FirebaseRx.child('.info/connected'),
  FirebaseRx.onValue,
  observable => observable.map(FirebaseRx.val));

FirebaseRx.onAuth = (ref) =>
  Rx.Observable.create(observer => {
    const onAuthHandler = authData => {
      observer.onNext(authData);
    };

    ref.onAuth(onAuthHandler);
    return Rx.Disposable.create(() => {
      ref.offAuth(onAuthHandler);
    });
  });
