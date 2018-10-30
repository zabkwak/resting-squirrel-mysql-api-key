import { expect } from 'chai';
import mysql from 'mysql';
import HttpError from 'http-smart-error';
import SmartError from 'smart-error';

import RSApiKey from '../src';

const MYSQL_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rs_mysql_api_key',
    connectionLimit: 1,
};

let API_KEY = null;

describe('Module creation', () => {

    it('creates the module with the mysql config', () => {
        const m = RSApiKey(MYSQL_CONFIG);
        expect(m).to.be.a('function');
        expect(m.createApiKey).to.be.a('function');
        expect(m.removeApiKey).to.be.a('function');
    });

    it('creates the module with the mysql config as pool', () => {
        const pool = mysql.createPool(MYSQL_CONFIG);
        const m = RSApiKey(pool);
        expect(m).to.be.a('function');
        expect(m.createApiKey).to.be.a('function');
        expect(m.removeApiKey).to.be.a('function');
    });
});

describe('Api key creation', () => {

    const m = RSApiKey(MYSQL_CONFIG);

    it('creates the api key for identificator', (done) => {
        m.createApiKey(`identificator-${Date.now()}`, (err, apiKey) => {
            expect(err).to.be.null;
            expect(apiKey).to.be.a('string');
            done();
        });
    });

    it('creates the api key with limit 1', (done) => {
        m.createApiKey('identificator-limit', 1, (err, apiKey) => {
            expect(err).to.be.null;
            expect(apiKey).to.be.a('string');
            API_KEY = apiKey;
            done();
        });
    });

    it('tries to create api key for same identificator', (done) => {
        m.createApiKey('identificator-limit', (err, apiKey) => {
            expect(err).to.be.an.instanceOf(Error);
            expect(err.message).to.be.equal('Api key for identificator \'identificator-limit\' already exists.');
            done();
        });
    });
});

describe('Validator function call', () => {


    const m = RSApiKey(MYSQL_CONFIG);

    it('calls the validator function with invalid api key', async () => {
        expect(await m('API_KEY')).to.be.false;
    });

    it('calls the validator function with valid api key', async () => {
        await m(API_KEY);
    });

    it('calls the validator function with valid api key which does not have remaining quota', async () => {
        try {
            await m(API_KEY);
        } catch (err) {
            expect(err).to.be.an.instanceOf(HttpError);
            const { message, code, statusCode } = err;
            expect(message).to.be.equal('Api key calls limit exceeded.');
            expect(code).to.be.equal('ERR_API_KEY_LIMIT_EXCEEDED');
            expect(statusCode).to.be.equal(403);
        }
    });
});

describe('Api key removal', () => {

    it('removes the api key', (done) => {
        const m = RSApiKey(MYSQL_CONFIG);
        expect(m).to.be.a('function');
        expect(m.removeApiKey).to.be.a('function');
        m.removeApiKey(API_KEY, (err) => {
            expect(err).to.be.null;
            done();
        });
    });
});