import mysql from 'mysql';
import async from 'async';
import md5 from 'md5';
import HttpError from 'http-smart-error';

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
];

/**
 * @param {MysqlConfig|mysql.Pool}
 * @module
 */
export default (mysqlConfig) => {

    // importing Pool class from the mysql lib and checking the instanceof is not working (for some reason) so if the constructor name is pool the pool is not created again
    const pool = mysqlConfig.constructor && mysql.constructor.name === 'Pool' ? mysqlConfig : mysql.createPool(mysqlConfig);
    let ready = false;

    async.each(QUERIES, (query, callback) => pool.query(query, callback), (err) => {
        if (err) {
            throw err;
        }
        ready = true;
    });

    const handleMiddleware = (apiKey, next) => {
        if (!ready) {
            setTimeout(() => handleMiddleware(apiKey, next), 10);
            return;
        }
        pool.query(`select * from rs_api_key where api_key = ${pool.escape(apiKey)} && valid = 1 limit 0, 1`, (err, rows) => {
            if (err) {
                next(err);
                return;
            }
            if (!rows.length) {
                next(HttpError.create(403, 'Invalid API key.', 'api_key_invalid', { api_key: apiKey }));
                return;
            }
            // TODO api key quota
            next();
        });
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

    handleMiddleware.removeApiKey = (apiKey, cb = () => {}) => {
        pool.query(`delete from rs_api_key where api_key = ${pool.escape(apiKey)}`, cb);
    };

    return handleMiddleware;
};
