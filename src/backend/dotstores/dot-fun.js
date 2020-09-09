'use strict'

const CausalContext = require('../causal-context')
const { assert } = require('chai');

class DotFun {
  constructor (typename, state) {
    this.typename = typename
    this.state = state || new Map() // {K: I X N => V: DotStore}
  }

  static from(other) {
    return new DotFun(other.typename, new Map([...other.state]))
  }

  items() {
    return Array.from(this.state, ([dot, value]) => [dot, value])
  }

  dots () {
    return new Set(Array.from(this.state.keys()))
  }

  isBottom () {
    return this.state.size === 0
  }

  get(dot) {
    return this.state.get(dot)
  }

  has(dot) {
    return this.state.has(dot)
  }

  set(dot, value) {
    this.state.set(dot, value)
    return this
  }

  // join does not affect state, , returns delta
  static join ([m1, cc1], [m2, cc2]) {
    // handle undefined
    m1  = m1 || new DotFun()
    m2  = m2 || new DotFun()
    
    assert(m1 instanceof DotFun, "left hand dotstore is not an instance of DotFun")
    assert(m2 instanceof DotFun, "right hand dotstore is not an instance of DotFun")
    assert(cc1 instanceof CausalContext, "left hand has invalid CausalContext")
    assert(cc2 instanceof CausalContext, "right hand has invalid CausalContext")

    const allDots = new Set([...m1.state.keys(), ...m2.state.keys()])
    const resultDotStore = new DotFun(m1.typename || m2.typename)
    // NOTE: Assuming all keys are dots
    for (const dot of allDots) {
      if (m1.has(dot) && m2.has(dot)) {
        // No need to support join of values as we assume dots are unique
        assert(m1.get(dot) === m2.get(dot), "Error - both dotstores contain the same dot with different value")
        resultDotStore.set(dot, m1.get(dot))
      } else if (m1.has(dot) && !cc2.dotIn(dot)) {
        resultDotStore.set(dot, m1.get(dot))
      } else if (m2.has(dot) && !cc1.dotIn(dot)){
        resultDotStore.set(dot, m2.get(dot))
      }
    }
    return [resultDotStore, CausalContext.from(cc1).join(cc2)]
  }
}

module.exports = DotFun
