/* global URL, Blob, atob */
module.exports = initDbView

var base64Data = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICA' +
                 'gIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAL9JREFUOI2d07FtAkEQ' +
                 'heEPRAGEBHTgAhwTUQI0gIQDV0IZThwTUQAIAmKgAAJCy3ZowAELOi23tx' +
                 'xPmmC07/27Gu3AG35xztSnErUwwRGLMkNBu6jvYynQ55lwrAH+MHsGcA1/' +
                 '4bUu4C5cB1AajgFtvNcJx4CP0E8eCE+xjwEdbAuQYcXNq+C7m0ERck49uw' +
                 'pQhKTCN0ArcXhAD12sEx5cvnJKh1CVauYMOTVcNvGETc3sizDEMX7k1zmu' +
                 'b4z+ASn4V7TGZOqTAAAAAElFTkSuQmCC'
var attachment = new Blob([b64toBlob(base64Data)], {type: 'image/png'})

function initDbView ($container, db, otherDb) {
  var $table = $container.querySelector('table.data')
  var $log = $container.querySelector('.log')
  var $putBtn = $container.querySelector('.put-btn')
  var $putAttachmentBtn = $container.querySelector('.put-attachment-btn')
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

  $table.addEventListener('click', function (event) {
    var id = findId(event.target)
    db.get(id).then(function (doc) {
      doc.test = 'check ' + (parseInt(doc.test.substr('check '.length), 10) + 1)
      db.put(doc)
    }).catch(function () {
      log('cannot update deleted doc')
    })
  })

  $putBtn.addEventListener('click', function () {
    var id = Math.random().toString(36).substr(2, 5)
    db.put({
      _id: id,
      test: 'check 1',
      _attachments: {
        'check.png': {
          content_type: 'image/png',
          data: base64Data
        }
      }
    })
  })

  $putAttachmentBtn.addEventListener('click', function () {
    var id = Math.random().toString(36).substr(2, 5)
    db.putAttachment(id, 'check.png', attachment, 'image/png')
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

  db.allDocs({
    include_docs: true,
    attachments: true,
    binary: true
  })

  .then(function (result) {
    var docs = toDocs(result)
    log(result.rows.length + ' documents found', docs)
    docs.forEach(addRow.bind(null, $table))

    db.changes({
      include_docs: true,
      since: 'now',
      live: true,
      attachments: true,
      binary: true
    }).on('change', function (change) {
      var isNew = parseInt(change.doc._rev, 10) === 1
      var $tr = $table.querySelector('[data-id="' + change.id + '"]') || addRow($table, change.doc)

      if (change.deleted) {
        $tr.dataset.state = 'deleted'
        log('#' + change.id + ' deleted', change.doc)
        return
      }

      if (isNew) {
        $tr.dataset.state = 'new'
        log('#' + change.id + ' created', change.doc)
      } else {
        $tr.dataset.state = 'updated'
        $tr.innerHTML = toRowHtml(change.doc)
        log('#' + change.id + ' updated', change.doc)
      }
    })
  })
}

function toDocs (result) {
  return result.rows.map(function (row) {
    return row.doc
  })
}

function toRowHtml (doc) {
  // when you create and delete a document, and sync it after you delete, a change
  // still occurs on the remote database, but it has not _attachments property.
  var img = '-'
  if (doc._attachments) {
    var src = URL.createObjectURL(doc._attachments['check.png'].data)
    img = '<img src="' + src + '"></td>'
  }

  return '<th>' + doc._id + '</th><td>' + (doc.test || '-') + ' ' + img
}

function addRow ($table, doc) {
  var $tr = document.createElement('tr')
  $tr.dataset.id = doc._id

  $tr.innerHTML = toRowHtml(doc)
  $table.appendChild($tr)
  return $tr
}

// http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
function b64toBlob (b64Data, contentType, sliceSize) {
  contentType = contentType || ''
  sliceSize = sliceSize || 512

  var byteCharacters = atob(b64Data)
  var byteArrays = []

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize)

    var byteNumbers = new Array(slice.length)
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    var byteArray = new Uint8Array(byteNumbers)

    byteArrays.push(byteArray)
  }

  var blob = new Blob(byteArrays, {type: contentType})
  return blob
}

function findId ($target) {
  return $target.dataset.id || findId($target.parentNode)
}
