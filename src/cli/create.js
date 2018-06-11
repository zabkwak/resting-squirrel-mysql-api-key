#!/usr/bin/env node

import argsParser from 'args-parser';
import commandLineUsage from 'command-line-usage';

import RSApiKey from '../';

const args = argsParser(process.argv);

if (args.h || args.help) {

    const sections = [
        {
            header: 'Resting Squirrel MySQL Api key creator',
            content: 'Creates {italic api key} for the identificator.',
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'identificator',
                    typeLabel: '<string>',
                    description: 'Identificator of the API client.',
                },
                {
                    name: 'limit',
                    typeLabel: '<integer>',
                    description: 'Limit for the daily quota. Default 0.',
                },
                {
                    name: 'mysql',
                    typeLabel: '<string>',
                    description: 'MySQL uri connection string mysql://[user]:[password]@[host]/[database]'
                },
                {
                    name: 'mysql-host',
                    typeLabel: '<string>',
                    description: 'Host of the mysql server. Default "localhost".',
                },
                {
                    name: 'mysql-user',
                    typeLabel: '<string>',
                    description: 'User to log in to the mysql server. Default "root".',
                },
                {
                    name: 'mysql-password',
                    typeLabel: '<string>',
                    description: 'Passwrod of the user to log in to the mysql server. Default "".',
                },
                {
                    name: 'mysql-database',
                    typeLabel: '<string>',
                    description: 'Database. Default "rs_api_key".',
                },
                {
                    name: 'help',
                    description: 'Print this usage guide.',
                },
            ],
        },
    ];
    console.log(commandLineUsage(sections))

    process.exit(0);
}

if (!args.identificator) {
    console.error('Argument identificator is missing');
    process.exit(1);
}

const rsApiKey = RSApiKey(args.mysql || {
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

