

const uuid = require('../uuid')

class Backend {}

function init(options) {
    if (typeof options === 'number') {
        options = {replicaId: options}
      } else if (typeof options === 'undefined') {
        options = {}
      } else if (!isObject(options)) {
        throw new TypeError(`Unsupported value for init() options: ${options}`)
      }
      if (options.replicaId === undefined && !options.deferActorId) {
        options.replicaId = uuid()
      }
      root = {}
      state = { backendState: options.backend.init() } // TODO
      Object.defineProperty(root, OPTIONS,   {value: Object.freeze(options)})
      Object.defineProperty(root, STATE, {value: Object.freeze(state)})
      return Object.freeze(root)
}

function change(doc, options, callback) {
    if (doc[OBJECT_ID] !== ROOT_ID) {
      throw new TypeError('The first argument to DeltaMerge.change must be the document root')
    }
    if (doc[CHANGE]) {
      throw new TypeError('Calls to DeltaMerge.change cannot be nested')
    }
    if (typeof options === 'function' && callback === undefined) {
      ;[options, callback] = [callback, options]
    }
    if (typeof options === 'string') {
      options = {message: options}
    }
    if (options !== undefined && !isObject(options)) {
      throw new TypeError('Unsupported type of options')
    }
  
    const replicaId = getReplicaId(doc)
    if (!replicaId) {
      throw new Error('Replica ID must be initialized with setReplicaId() before making a change')
    }
    const context = new Context(doc, actorId)
    callback(rootObjectProxy(context))
  
    if (Object.keys(context.updated).length === 0) {
      // If the callback didn't change anything, return the original document object unchanged
      return [doc, null]
    } else {
      updateParentObjects(doc[CACHE], context.updated, context.inbound)
      return makeChange(doc, 'change', context, options)
    }
  }


/**
 * Returns the DeltaMerge Replica ID of the given document.
 */
function getReplicaId(doc) {
    return doc[STATE].replicaId || doc[OPTIONS].replicaId
  }