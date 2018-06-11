import { expect } from 'chai';

import rs from 'resting-squirrel';
import request from 'request';

import RSApiKey from '../src';
const MYSQL_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rs_mysql_api_key',
    connectionLimit: 1,
};
const rsApiKey = RSApiKey(MYSQL_CONFIG);

const app = rs({
    apiKey: {
        enabled: true,
        validator: rsApiKey,
    },
    log: false,
});

app.get('/', (req, res, next) => next(null, req.query));

app.start();

let API_KEY = null;

describe('Api key creation', () => {

    it('creates the API key', (done) => {
        rsApiKey.createApiKey(`rs-test-${Date.now()}`, (err, apiKey) => {
            expect(err).to.be.null;
            API_KEY = apiKey;
            done();
        });
    });
});

describe('RS calls', () => {

    it('calls the API endpoint with valid api key', (done) => {
        request.get({
            url: 'http://localhost:8080',
            qs: { api_key: API_KEY },
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.statusCode).to.be.equal(200);
            expect(body).to.have.all.keys(['data', '_meta']);
            expect(body.data).to.have.all.keys(['api_key']);
            expect(body.data.api_key).to.be.equal(API_KEY);
            done();
        });
    });

    it('calls the API endpoint without api key', (done) => {
        request.get({
            url: 'http://localhost:8080',
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.statusCode).to.be.equal(403);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { message, code } = body.error;
            expect(message).to.be.equal('Api key is missing.');
            expect(code).to.be.equal('ERR_MISSING_API_KEY');
            done();
        });
    });

    it('calls the API endpoint with invalid key', (done) => {
        request.get({
            url: 'http://localhost:8080',
            qs: { api_key: 'API_KEY' },
            gzip: true,
            json: true,
        }, (err, res, body) => {
            expect(err).to.be.null;
            expect(res.statusCode).to.be.equal(403);
            expect(body).to.have.all.keys(['error', '_meta']);
            const { message, code } = body.error;
            expect(message).to.be.equal('Invalid API key.');
            expect(code).to.be.equal('ERR_API_KEY_INVALID');
            done();
        });
    });
});