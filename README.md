# resting-squirrel-mysql-api-key
Api key validator for resting-squirrel using mysql database.

## Installation
```bash
$ npm install resting-squirrel-mysql-api-key --save
```

## Usage
### Validator
```javascript
import rs from 'resting-squirrel';
import RSApiKey from 'resting-squirrel-mysql-api-key';

const rsApiKey = RSApiKey({/* DB config */});

const app = rs({
    apiKey: {
        enabled: true,
        validator: rsApiKey,
    },
});

app.start();

```
### Creation of the api key
#### Javascript
```javascript
import RSApiKey from 'resting-squirrel-mysql-api-key';

const rsApiKey = RSApiKey({/* DB config */});

// Creates api key for client "identificator" with 50 daily api calls limit
rsApiKey.createApiKey('identificator', 50, (err, apiKey) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(apiKey);
});
```
#### Command line
```bash
# Creates api key for client "identificator" with 50 daily api calls limit
node_modules/.bin/rs-api-key-create --identificator=identificator --limit=50 --mysql-host=localhost --mysql-user=user --mysql-password=passwd --mysql-database=project_database
```

## TODO
- mysql connection string in the cli command