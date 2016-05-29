'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FirebaseSnapshotRx = exports.FirebaseRx = undefined;

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _rx = require('rx');

var _rx2 = _interopRequireDefault(_rx);

var _firebaseTokenGenerator = require('firebase-token-generator');

var _firebaseTokenGenerator2 = _interopRequireDefault(_firebaseTokenGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FirebaseRx = exports.FirebaseRx = {};
var FirebaseSnapshotRx = exports.FirebaseSnapshotRx = {};

FirebaseRx.of = function (ref) {
  return _rx2.default.Observable.of(ref);
};
FirebaseRx.root = function (ref) {
  return ref.root();
};
FirebaseRx.unauth = function (ref) {
  return ref.unauth();
};
FirebaseRx.child = _ramda2.default.curry(function (path, ref) {
  return ref.child(path);
});
FirebaseRx.push = _ramda2.default.curry(function (value, ref) {
  return _rx2.default.Observable.fromPromise(ref.push(value));
});
FirebaseRx.set = _ramda2.default.curry(function (value, ref) {
  return _rx2.default.Observable.fromPromise(ref.set(value));
});
FirebaseRx.update = _ramda2.default.curry(function (value, ref) {
  return _rx2.default.Observable.fromPromise(ref.update(value));
});
FirebaseRx.remove = function (ref) {
  return _rx2.default.Observable.fromPromise(ref.remove());
};

FirebaseSnapshotRx.val = function (snapshot) {
  return snapshot.val();
};
FirebaseSnapshotRx.exists = function (snapshot) {
  return snapshot.exists();
};

FirebaseRx.authWithSecretToken = _ramda2.default.curry(function (secret, uid, options, ref) {
  return _rx2.default.Observable.just(new _firebaseTokenGenerator2.default(secret)).map(function (tokenGenerator) {
    return tokenGenerator.createToken({ uid: uid }, options);
  }).flatMap(function (authToken) {
    return ref.authWithCustomToken(authToken);
  }).map(_ramda2.default.identity(ref));
});

FirebaseRx.on = _ramda2.default.curry(function (eventType, ref) {
  return _rx2.default.Observable.create(function (observer) {
    var onHandler = ref.on(eventType, function (value) {
      return observer.onNext(value);
    }, function (error) {
      return observer.onError(error);
    });

    return _rx2.default.Disposable.create(function () {
      ref.off(eventType, onHandler);
    });
  });
});

FirebaseRx.once = _ramda2.default.curry(function (eventType, ref) {
  return _rx2.default.Observable.create(function (observer) {
    ref.once(eventType, function (snapshot) {
      observer.onNext(snapshot);
      observer.onCompleted();
    }, function (error) {
      return observer.onError(error);
    });
  });
});

FirebaseRx.onValue = FirebaseRx.on('value');
FirebaseRx.onChildAdded = FirebaseRx.on('child_added');
FirebaseRx.onChildRemoved = FirebaseRx.on('child_removed');
FirebaseRx.onChildChanged = FirebaseRx.on('child_changed');

FirebaseRx.onceValue = FirebaseRx.once('value');
FirebaseRx.onceChildAdded = FirebaseRx.once('child_added');
FirebaseRx.onceChildRemoved = FirebaseRx.once('child_removed');
FirebaseRx.onceChildChanged = FirebaseRx.once('child_changed');

FirebaseRx.onConnected = _ramda2.default.pipe(FirebaseRx.root, FirebaseRx.child('.info/connected'), FirebaseRx.onValue, function (observable) {
  return observable.map(FirebaseRx.val);
});

FirebaseRx.onAuth = function (ref) {
  return _rx2.default.Observable.create(function (observer) {
    var onAuthHandler = function onAuthHandler(authData) {
      observer.onNext(authData);
    };

    ref.onAuth(onAuthHandler);
    return _rx2.default.Disposable.create(function () {
      ref.offAuth(onAuthHandler);
    });
  });
};