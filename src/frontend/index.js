const Backend = require('../../src/backend')
const Proxies = require('../../src/frontend/proxies')
const { BACKEND } = require('../../src/frontend/constants')
//const { ORMap } = require('../backend/crdts/unifiedCRDTs')

class Frontend {
  constructor(options) {
    const replicaId = options["REPLICA_ID"] || "r" + Math.floor(Math.random() * 1000)
    this[BACKEND] = new Backend(replicaId)
  }
}

function getBackend(frontend) {
  return frontend[BACKEND]
}

function documentValue(frontend) {
  return frontend[BACKEND].getObject()
}

function init(options) {
  const frontend = {}
  const replicaId = options["REPLICA_ID"] || "r" + Math.floor(Math.random() * 1000)
  Object.defineProperty(frontend, BACKEND, {value: new Backend(replicaId)})
  return frontend
}

function change(frontend, options, callback) {
  let context = {}
  context.doc = getBackend(frontend).getState()
  let rooProxy = Proxies.createRootObjectProxy(context)
  callback(rooProxy)
  getBackend(frontend).setState(context.doc)
  return new Proxy(frontend, Proxies.FrontendHandler)
}

module.exports = { Frontend, init, change, documentValue }