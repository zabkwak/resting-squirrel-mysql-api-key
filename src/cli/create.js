#!/usr/bin/env node

import argsParser from 'args-parser';

import RSApiKey from '../';

const args = argsParser(process.argv);

if (!args.identificator) {
    console.error('Argument identificator is missing');
    process.exit(1);
}

const rsApiKey = RSApiKey({
    host: args['mysql-host'] || 'localhost',
    user: args['mysql-user'] || 'root',
    password: args['mysql-password'] || '',
    database: args['mysql-database'] || 'rs_api_key',
});

rsApiKey.createApiKey(args.identificator, args.limit || 0, (err, apiKey) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
    console.log(`API key for ${args.identificator} generated`, apiKey);
    process.exit(0);
});

