'use strict'

const uuid = require('./uuid')
const CausalContext = require('./causal-context')
const DotFun = require('./dotstores/dot-fun')
const DotFunMap = require('./dotstores/dot-fun-map')
const DotMap = require('./dotstores/dot-map')

class Backend {
    constructor(id, dotstore, type = 'json') {
      this._id = id || uuid() // the id of the backend to be used in the causal context
      // the state is (dotstore, cc)
      this._state = [dotstore || new DotMap(type), CausalContext(this._id)]
      // the changes
      this._deltas = [undefined,  new CausalContext()]

      let joinFunction
      if (this._state[0] instanceof DotMap) {
        joinFunction = DotMap.join
      }	else if (this._state[0] instanceof DotFunMap) {
        joinFunction = DotFunMap.join
      } else {
        joinFunction = DotFun.join
      }
      this._joinFunction = joinFunction
    }

    getID() {
      return this._id
    }

    // applies a mutator on the current state and store it in the list of deltas
    applyMutator(mutator) {
      const delta = mutator([this._state, this._cc])
      // add to current list of deltas
      this._deltas = this._joinFunction(this._deltas, delta)
      // update the current backend state
      this._state = this._joinFunction(this._state, delta)
    } 

    // joins a delta with the current state
    joinDelta(delta) {
      // apply to current state
      const delta = deltaMutator([this._state, this._cc])
      // update the current backend state
      this._state = this._joinFunction(this._state, delta)
    }

    resetDeltas() {
      this._deltas = [undefined,  new CausalContext()]
    }

    // returns a copy of the current deltas
    getChanges() {
      let dotstoreCopy
      if (this._state[0] instanceof DotMap) {
        dotstoreCopy = DotMap.from(this._state[0])
      }	else if (this._state[0] instanceof DotFunMap) {
        dotstoreCopy = DotFunMap.from(this._state[0])
      } else {
        dotstoreCopy = DotFun.from(this._state[0])
      }
      const res = [dotstoreCopy, CausalContext.from(this._deltas[1])]
      return res
    }

    getChangesAndReset() {
      const res = getDeltas()
      resetDeltas()
      return res
    }

    getObject() {
      // get dot store value?
    }
}