import '@babel/polyfill';
import mysql from 'mysql';
import async from 'async';
import md5 from 'md5';
import HttpError from 'http-smart-error';

import Pool from 'mysql/lib/Pool';

const QUERIES = [`
    CREATE TABLE IF NOT EXISTS \`rs_api_key\` (
        \`identificator\` char(100) COLLATE utf8_czech_ci NOT NULL,
        \`api_key\` char(255) COLLATE utf8_czech_ci NOT NULL,
        \`limit\` int(11) NOT NULL DEFAULT 0,
        \`valid\` int(1) NOT NULL DEFAULT 1,
        \`created_time\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`identificator\`),
        UNIQUE KEY \`api_key\` (\`api_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_czech_ci;
    `,
    `
    CREATE TABLE IF NOT EXISTS \`rs_api_key_limit\` (
        \`api_key\` char(255) COLLATE utf8_czech_ci NOT NULL,
        \`date\` date,
        \`count\` int(11) NOT NULL DEFAULT 1,
        PRIMARY KEY (\`api_key\`, \`date\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_czech_ci;
    `
];

const query = (pool, query) => new Promise((resolve, reject) => {
    pool.query(query, (err, data) => {
        if (err) {
            reject(err);
            return;
        }
        resolve(data);
    });
});

const wait = (timeout = 10) => new Promise(resolve => setTimeout(resolve, timeout));

/**
 * @param {MysqlConfig|mysql.Pool}
 * @module
 */
export default (mysqlConfig) => {
    let pool;
    if (mysqlConfig instanceof Pool) {
        pool = mysqlConfig;
    } else {
        const keys = Object.keys(mysqlConfig);
        // Problem with node.js dependencies if mysql module has different versions accross the modules
        if (keys.includes('config') && keys.includes('_events') && keys.includes('_allConnections')) {
            pool = mysqlConfig;
        } else {
            pool = mysql.createPool(mysqlConfig);
        }
    }
    let ready = false;

    async.each(QUERIES, (query, callback) => pool.query(query, callback), (err) => {
        if (err) {
            throw err;
        }
        ready = true;
    });

    const handleMiddleware = async (apiKey) => {
        if (!ready) {
            wait();
            return handleMiddleware(apiKey);
        }
        const keys = await query(pool, `select * from rs_api_key where api_key = ${pool.escape(apiKey)} && valid = 1 limit 0, 1`);
        if (!keys.length) {
            return false;
        }
        const { api_key, limit } = keys.shift();
        const limits = await query(pool, `select * from rs_api_key_limit where api_key = ${pool.escape(apiKey)} && \`date\` = CURRENT_DATE limit 0, 1`);
        let remains = limit;
        if (limits.length) {
            const { count } = limits.shift();
            remains -= count;
        }
        if (limit > 0 && remains === 0) {
            throw HttpError.create(403, 'Api key calls limit exceeded.', 'api_key_limit_exceeded');
        }
        const info = await query(pool, `update rs_api_key_limit set \`count\` = \`count\` + 1 where api_key = ${pool.escape(apiKey)} && \`date\` = CURRENT_DATE`);
        if (!info.affectedRows) {
            await query(pool, `insert into rs_api_key_limit (api_key, \`date\`) values (${pool.escape(apiKey)}, ${pool.escape(new Date())})`);
        }
        return true;
    };

    handleMiddleware.createApiKey = (identificator, limit, cb = () => { }) => {
        if (typeof limit === 'function') {
            cb = limit;
            limit = 0;
        }
        const apiKey = md5(`${Date.now()}rs-api-key${Date.now()}${Math.random()}`);
        pool.query(`insert into rs_api_key (\`identificator\`, \`api_key\`, \`limit\`) values (${pool.escape(identificator)}, ${pool.escape(apiKey)}, ${pool.escape(limit)})`, (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    cb(new Error(`Api key for identificator '${identificator}' already exists.`));
                    return;
                }
                cb(err);
                return;
            }
            cb(null, apiKey);
        });
    };

    handleMiddleware.removeApiKey = (apiKey, cb = () => { }) => {
        pool.query(`delete from rs_api_key where api_key = ${pool.escape(apiKey)}`, cb);
    };

    return handleMiddleware;
};
