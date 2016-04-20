'use strict';
import _ from 'lodash';
import Util from 'util';
import Chai from 'chai';
import Uuid from 'node-uuid';
import Hpe from '../index';

const expect = Chai.expect;

describe('HPE API Integration', function () {
    it('Should return success for authentication', function (done) {
        Hpe
            .session()
            .subscribe(session => {
                    expect(session).to.have.property('request');
                    done();
                },
                error => done(error));
    });

    it.only('Should return success for create server', function (done) {
        const request = {
            name: Util.format("ci-server-%d", _.now()),
            instance_id: Uuid.v1()
        };

        Hpe
            .session()
            .flatMap(session => {
                return Hpe.createServer(session, request);
            })
            .subscribe(response => {
                    expect(response.name).to.equal(request.name);
                    expect(response.instance_id).to.equal(request.instance_id);
                    expect(response.server_type).to.equal('CodeFresh');
                    done();
                },

                error => done(error));
    });
});
