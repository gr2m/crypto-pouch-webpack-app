require('./style.css')

var PouchDB = require('pouchdb')
PouchDB.plugin(require('crypto-pouch'))

var initDbView = require('./init-db-view')

var remoteDb = new PouchDB('http://127.0.0.1:8079/crypto-test')
var localDb = new PouchDB('crypto-test')

// _deleted & _revisions can be removed when this lands:
// https://github.com/calvinmetcalf/crypto-pouch/pull/34
localDb.crypto('password', {ignore: ['_attachments', '_deleted', '_revisions']})

initDbView(document.querySelector('.local'), localDb, remoteDb)
initDbView(document.querySelector('.remote'), remoteDb, localDb)

top.window.PouchDB = PouchDB
top.window.remoteDb = remoteDb
top.window.cryptoDb = localDb
top.window.db = new PouchDB('crypto-test')

console.log('Access databases:\n- db: local db without crypto\n- cryptoDb: local db with crypto\n- remoteDb')
