'use strict'

const uuid = require('./uuid')
const ORMap = require('./crdts/ormap')
const CausalContext = require('./causal-context')

class Backend {
    constructor(id, state) {
      this._id = id || uuid()
      this.state = state || new DotMap(ORMap.typename())
      this._cc = CausalContext(this._id)
    }

    getID() {
        return this._id
    }
}
