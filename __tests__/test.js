import { expect } from 'chai';
import mysql from 'mysql';
import HttpError from 'http-smart-error';

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
    });

    it('creates the module with the mysql config as pool', () => {
        const pool = mysql.createPool(MYSQL_CONFIG);
        const m = RSApiKey(pool);
        expect(m).to.be.a('function');
        expect(m.createApiKey).to.be.a('function');
    });
});

describe('Api key creation', () => {

    it('creates the api key for identificator', (done) => {
        const m = RSApiKey(MYSQL_CONFIG);
        expect(m).to.be.a('function');
        expect(m.createApiKey).to.be.a('function');
        m.createApiKey('identificator', (err, apiKey) => {
            expect(err).to.be.null;
            expect(apiKey).to.be.a('string');
            API_KEY = apiKey;
            done();
        });
    });

    it('tries to create api key for same identificator', (done) => {
        const m = RSApiKey(MYSQL_CONFIG);
        expect(m).to.be.a('function');
        expect(m.createApiKey).to.be.a('function');
        m.createApiKey('identificator', (err, apiKey) => {
            // I have no idea why the to.be.an('object') is not working
            expect(typeof err).to.be.equal('object');
            expect(err.code).to.be.equal('ER_DUP_ENTRY');
            done();
        });
    });
});

describe('Validator function call', () => {

    it('crates the module and calls the validtor function with invalid api key', (done) => {
        const m = RSApiKey(MYSQL_CONFIG);
        expect(m).to.be.a('function');
        expect(m.createApiKey).to.be.a('function');
        m('API_KEY', (err) => {
            expect(err).to.be.an.instanceOf(HttpError);
            const { message, code, statusCode, api_key } = err;
            expect(message).to.be.equal('Invalid API key.');
            expect(code).to.be.equal('ERR_API_KEY_INVALID');
            expect(statusCode).to.be.equal(403);
            expect(api_key).to.be.equal('API_KEY');
            done();
        });
    });
});

describe('Api key removal', () => {

    it('removes the api key', (done) => {
        const m = RSApiKey(MYSQL_CONFIG);
        expect(m).to.be.a('function');
        expect(m.createApiKey).to.be.a('function');
        m.removeApiKey(API_KEY, (err) => {
            expect(err).to.be.null;
            done();
        });
    });
});