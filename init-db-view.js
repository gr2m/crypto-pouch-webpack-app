module.exports = initDbView

function initDbView ($container, db, otherDb) {
  var $log = $container.querySelector('.log')
  var $addBtn = $container.querySelector('.add-btn')
  var $syncBtn = $container.querySelector('.sync-btn')
  var $clearBtn = $container.querySelector('.clear-btn')

  var name = $container.classList[0].toUpperCase()

  function log (text, data) {
    if (data) {
      console.log('[' + name + ']', text, data)
    } else {
      console.log('[' + name + ']', text)
    }
    $log.textContent = text + '\n' + $log.textContent
  }

  $addBtn.addEventListener('click', function () {
    var id = Math.random().toString(36).substr(2, 5)
    db.put({foo: 'bar'}, id)
  })
  $syncBtn.addEventListener('click', function () {
    db.replicate.to(otherDb)
    .on('complete', function (result) {
      log(result.docs_written + ' docs synced', result)
    })
    .on('error', function (error) {
      log('Sync Error', error)
    })
  })
  $clearBtn.addEventListener('click', function () {
    db.allDocs({include_docs: true})

    .then(function (result) {
      return result.rows.map(function (row) {
        row.doc._deleted = true
        return row.doc
      })
    })

    .then(function (docs) {
      return db.bulkDocs(docs)
    })
  })

  db.allDocs({include_docs: true})

  .then(function (result) {
    log(result.rows.length + ' documents found', toDocs(result))

    db.changes({
      include_docs: true,
      since: 'now',
      live: true
    }).on('change', function (change) {
      var isNew = parseInt(change.doc._rev, 10) === 1

      if (change.deleted) {
        return log(change.id + ' deleted', change.doc)
      }

      if (isNew) {
        log(change.id + ' created', change.doc)
      } else {
        log(change.id + ' updated', change.doc)
      }
    })
  })
}

function toDocs (result) {
  return result.rows.map(function (row) {
    return row.doc
  })
}
