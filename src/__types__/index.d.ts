declare module 'resting-squirrel-mysql-api-key' {

    import * as mysql from 'mysql';

    interface IMysqlConfig {
        host: string;
        user: string;
        password: string;
        database: string;
        connectionLimit?: number;
    }

    export default function (config: IMysqlConfig | mysql.Pool): {
        (apiKey: string, next: (err?: Error) => void): void;

        createApiKey(identificator: string): void;
        createApiKey(identificator: string, cb: (err?: Error, apiKey?: string) => void): void;
        createApiKey(identificator: string, limit: number, cb: (err?: Error, apiKey?: string) => void): void;

        removeApiKey(identificator: string): void;
        removeApiKey(identificator: string, cb: (err?: Error) => void): void;
    };
}