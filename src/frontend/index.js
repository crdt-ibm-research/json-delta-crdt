const Backend = require('../../src/backend')
const Proxies = require('../../src/frontend/proxies')
const { BACKEND, DELTAS, DELTAS_CACHE_MODE, COMPRESSED_DELTAS, UNCOMPRESSED_DELTAS } = require('../../src/frontend/constants')
const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')

function getBackend(frontend) {
  return frontend[BACKEND]
}

function documentValue(frontend) {
  return frontend[BACKEND].getObject()
}

/**
 * @param frontend: doc (returned from init, change or applyChanges methods)
 * @param delta: a delta created locally by the change method or delta received from the a remote replica
 * @returns merge of all deltas in cache. Note that this function doesn't change the state or the cache (as the cache will be empties shortly)
 */
function addDeltaToCache(frontend, delta) {
  if (frontend[DELTAS_CACHE_MODE] == COMPRESSED_DELTAS) {
    if (frontend[DELTAS].length == 0) {
      frontend[DELTAS].push(delta)
    } else {
      let existingDelta = frontend[DELTAS][0]
      frontend[DELTAS][0] = DotMap.join(existingDelta, delta)
    }
  } else if (frontend[DELTAS_CACHE_MODE] == UNCOMPRESSED_DELTAS){
    // we compress only in the end
    frontend[DELTAS].push(delta)
  }
}

/**
 * @param frontend: doc (returned from init, change or applyChanges methods)
 * @returns merge of all deltas in cache. Note that this function doesn't change the state or the cache (as the cache will be empties shortly)
 */
function reduceDeltas(frontend) {
  if (frontend[DELTAS].length == 0) {
    return {}
  } else {
    let delta = frontend[DELTAS][0]
    let i
    for (i  = frontend[DELTAS].length - 1;  i  < frontend[DELTAS].length ; i++) {
      let currentDelta = frontend[DELTAS][i]
      delta = DotMap.join(currentDelta, delta)
    }
    return delta
  }
}

function init(options) {
  const frontend = {}
  const replicaId = options["REPLICA_ID"] || "r" + Math.floor(Math.random() * 1000)
  const deltasCacheMode = options["DELTAS_CACHE_MODE"] || COMPRESSED_DELTAS
  Object.defineProperty(frontend, BACKEND, {value: new Backend(replicaId)})
  Object.defineProperty(frontend, DELTAS, {value: []})
  Object.defineProperty(frontend, DELTAS_CACHE_MODE, {value: deltasCacheMode})

  // return frontend
  return new Proxy(frontend, Proxies.FrontendHandler)
}

function change(frontend, options, callback) {
  let context = {}
  context.doc = getBackend(frontend).getState()
  let rooProxy = Proxies.createRootObjectProxy(context)
  callback(rooProxy)
  getBackend(frontend).setState(context.doc)
  addDeltaToCache(frontend, context.delta)
  return frontend
  // return new Proxy(frontend, Proxies.FrontendHandler)
}

/**
 * Returns a new document object initialized with the given state.
 */
function from(initialState, options) {
  return change(init(options), 'Initialization', doc => Object.assign(doc, initialState))
}

/**
 * @param frontend: doc (returned from init, change or applyChanges methods)
 * @param delta: a delta
 * @returns a proxy to a new doc
 */
function applyChanges(frontend, delta) {
  //getBackend(frontend).joinDelta(delta)
  let innerState = getBackend(frontend).getState()
  innerState = DotMap.join(innerState, delta)
  getBackend(frontend).setState(innerState)
  addDeltaToCache(frontend, delta)
  return frontend
}

/**
 * @param frontend: doc (returned from init, change or applyChanges methods)
 * @returns merge of all deltas since last call
 */
function getChanges(frontend) {
  let reducedDeltas = reduceDeltas(frontend)
  frontend[DELTAS] = []
  return reducedDeltas
}

module.exports = { init, change, documentValue, applyChanges, from, getChanges }