const Backend = require('../../src/backend')
const Proxies = require('../../src/frontend/proxies')
const { BACKEND } = require('../../src/frontend/constants')
const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
//const { ORMap } = require('../backend/crdts/unifiedCRDTs')

/*
class Frontend {
  constructor(options) {
    const replicaId = options["REPLICA_ID"] || "r" + Math.floor(Math.random() * 1000)
    this[BACKEND] = new Backend(replicaId)
  }
}
*/

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
  //return frontend
  return new Proxy(frontend, Proxies.FrontendHandler)
}

function change(frontend, options, callback) {
  let context = {}
  context.doc = getBackend(frontend).getState()
  let rooProxy = Proxies.createRootObjectProxy(context)
  callback(rooProxy)
  getBackend(frontend).setState(context.doc)
  return frontend
  //return new Proxy(frontend, Proxies.FrontendHandler)
}

/**
 * Returns a new document object initialized with the given state.
 */
function from(initialState, options) {
  return change(init(options), 'Initialization', doc => Object.assign(doc, initialState))
}

/**
 * @param frontend: doc (returned from init, change or applyChanges methods)
 * @param changes: a delta
 * @returns a proxy to a new doc
 */
function applyChanges(frontend, delta) {
  //getBackend(frontend).joinDelta(delta)
  let innerState = getBackend(frontend).getState()
  innerState = DotMap.join(innerState, delta)
  getBackend(frontend).setState(innerState)
  return frontend
}

module.exports = { init, change, documentValue, applyChanges, from }