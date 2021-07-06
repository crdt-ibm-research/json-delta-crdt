const Backend = require('../../src/backend/index')
const CausalContext = require('../../src/backend/causal-context')
const Proxies = require('../../src/frontend/proxies')
const { BACKEND, DELTAS, DELTAS_CACHE_MODE, COMPRESSED_DELTAS, UNCOMPRESSED_DELTAS, REPLICA_ID } = require('../../src/frontend/constants')
const { DotMap } = require('../backend/dotstores')
const { ORMap } = require('../backend/crdts')

function getBackend(frontend) {
  return frontend[BACKEND]
}

function documentValue(frontend) {
  return frontend[BACKEND].getObject()
}

function createBottomDelta(frontend) {
  return [new DotMap(ORMap.typename()), new CausalContext(frontend[REPLICA_ID])]
}

/**
 * @param frontend: doc (returned from init, change or applyChanges methods)
 * @param delta: a delta created locally by the change method or delta received from the a remote replica
 * @returns List of all deltas currently stored in the cache. These deltas are either compressed into a single delta or stored separately.
 */
function addDeltaToCache(frontend, delta) {
  if (frontend[DELTAS_CACHE_MODE] == COMPRESSED_DELTAS) {
    let existingDelta = frontend[DELTAS][0]
    frontend[DELTAS][0] = DotMap.join(existingDelta, delta)
  } else if (frontend[DELTAS_CACHE_MODE] == UNCOMPRESSED_DELTAS){
    // In this mode the deltas are compressed in a lazy manner
    frontend[DELTAS].push(delta)
  }
}

function init(options) {
  const frontend = {}
  const replicaId = options["REPLICA_ID"] || "r" + Math.floor(Math.random() * 1000)
  const deltasCacheMode = options["DELTAS_CACHE_MODE"] || COMPRESSED_DELTAS
  const backend = new Backend(replicaId, options["DOT_STORE"], options["CC"])
  Object.defineProperty(frontend, BACKEND, {value: backend })
  Object.defineProperty(frontend, REPLICA_ID, {value: replicaId})
  Object.defineProperty(frontend, DELTAS_CACHE_MODE, {value: deltasCacheMode})
  Object.defineProperty(frontend, DELTAS, {value: [createBottomDelta(frontend)]})

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
  let deltaReducer = (accumulatedDelta, currentDelta) => DotMap.join(accumulatedDelta, currentDelta);
  let reducedDeltas = frontend[DELTAS].reduce(deltaReducer)
  frontend[DELTAS] = [createBottomDelta(frontend)]
  return reducedDeltas
}

module.exports = { init, change, documentValue, applyChanges, from, getChanges }