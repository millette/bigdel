'use strict'

/*
Delete all docs in the _users table (change dbUrl otherwise)
except design docs (with an _id starting with '_design/').

Use with care.
*/

// core
const http = require('http')
const url = require('url')
const dbUrl = 'http://localhost:5984/_users'

http.get(`${dbUrl}/_all_docs`, (res) => {
  let body = ''
  res.setEncoding('utf8')
  res.on('data', (chunk) => body += chunk )
  res.on('end', () => {
    const docs = JSON.parse(body).rows
      .filter((d) => d.id.indexOf('_design/'))
      .map((d) => { return {
        _id: d.id,
        _rev: d.value.rev,
        _deleted: true
      } })
    if (!docs.length) { return console.log(`Nothing to delete on ${dbUrl} db.`) }
    const req = http.request(Object.assign(
      url.parse(`${dbUrl}/_bulk_docs`),
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      }
    ), (res) => {
      body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => body += chunk )
      res.on('end', () => console.log([
        `Deleted ${JSON.parse(body).filter((x) => x.ok).length}`,
        `out of ${docs.length} from ${dbUrl} db.`
      ].join(' ')))
    })
    req.end(JSON.stringify({docs: docs}))
    req.on('error', (e) => console.log(`Got error2: ${e}`))
  })
}).on('error', (e) => console.log(`Got error: ${e}`))
