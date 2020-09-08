'use strict'

const CausalContext = require('./causal-context')

class Delta {
  constructor(dotstore, cc) {
    this.dotstore = dotstore
    this.cc = cc || new CausalContext()
  }

  // static join(d1, d2) {
  //   if (d1.dotstore.typename !== d2.dotstore.typename) {
  //     throw new Error(`deltas must be of the same type for join (${d1.dotstore.typename} != ${d2.dotstore.typename})`)
  //   }
  //   const CRDT = require('.')
  //   const t = CRDT.type(d1.dotstore.typename)
  //   return t.join(d1, d2)
  // }
}

module.exports = Delta