require('./style.css')

var PouchDB = require('pouchdb')
PouchDB.plugin(require('crypto-pouch'))

var initDbView = require('./init-db-view')

var remoteDb = new PouchDB('http://127.0.0.1:8079/crypto-test')
var localDb = new PouchDB('crypto-test')
localDb.crypto('password', {ignore: ['_attachments', '_deleted', '_revisions']})

initDbView(document.querySelector('.local'), localDb, remoteDb)
initDbView(document.querySelector('.remote'), remoteDb, localDb)
