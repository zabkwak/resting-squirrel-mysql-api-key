# resting-squirrel-mysql-api-key
Api key validator for resting-squirrel using mysql database.

## Installation
```bash
$ npm install resting-squirrel-mysql-api-key --save
```

## Usage

```javascript
import rs from 'resting-squirrel';
import RSApiKey from 'resting-squirrel-mysql-api-key';

const dbConfig = config.db;

const rsApiKey = RSApiKey(dbConfig);

const app = rs({
    apiKey: {
        enabled: true,
        validator: rsApiKey,
    },
});

```