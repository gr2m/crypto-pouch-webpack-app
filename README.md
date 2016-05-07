# crypto-pouch-webpack-app

Local Setup

```
git clone https://github.com/gr2m/crypto-pouch-webpack-app.git
cd crypto-pouch-webpack-app
npm install
```

Start PouchDB Server and let it run in the background. No data gets persisted,
restart to wipe all data

```
npm run db
```

Start dev server

```
npm start
```

For debugging, you can access 3 PouchDB instances in the browser console:

1. `db` – local db without crypto
2. `cryptoDb` - local db with crypto
3. `remoteDb`

![demo](https://raw.githubusercontent.com/gr2m/crypto-pouch-webpack-app/master/crypto-pouch-test-app.gif)
