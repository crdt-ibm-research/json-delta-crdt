'use strict'

const CausalContext = require('../causal-context')
const DotFun = require('./dot-fun');
const DotMap = require('./dot-map');
const { assert } = require('chai');

class DotFunMap {
  constructor (typename, state) {
    this.typename = typename
    this.state = state || new Map() // {Dot-as-string -> Value}
  }

  static from(other) {
    return new DotFunMap(other.typename, new Map([...other.state]))
  }

  items() {
    return Array.from(this.state, ([dot, value]) => [dot, value])
  }

  dots() { // returns Set()
		const result = new Set()
		for (let value of this.state.values()) {
			let dots = value.dots()
			dots.forEach(result.add, result);
		}
		return result
	}

  isBottom () {
    return this.state.size === 0
  }

  size() {
    return this.state.size
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
    m1  = m1 || new DotFunMap()
    m2  = m2 || new DotFunMap()
    
    assert(m1 instanceof DotFunMap, "left hand dotstore is not an instance of DotFunMap")
    assert(m2 instanceof DotFunMap, "right hand dotstore is not an instance of DotFunMap")
    assert(cc1 instanceof CausalContext, "left hand has invalid CausalContext")
    assert(cc2 instanceof CausalContext, "right hand has invalid CausalContext")

    const allDots = new Set([...m1.state.keys(), ...m2.state.keys()])
    const resultDotStore = new DotFunMap(m1.typename || m2.typename)
    // NOTE: Assuming all keys are dots
    for (const dot of allDots) {
      if (m1.has(dot) && m2.has(dot)) {
        let left = m1.get(dot) // DotStore
        let right = m2.get(dot) // DotStore
        
        const type = left || right
        let joinFunction;
        if (type instanceof DotMap) {
          joinFunction = DotMap.join
        }	else if (type instanceof DotFun) {
          joinFunction = DotFun.join
        } else if (type instanceof DotFunMap) {
          joinFunction = DotFunMap.join
        }

        const res = joinFunction([left, cc1] , [right, cc2])
        const valueForKey = res[0]

        if (!valueForKey.isBottom()) {
          resultDotStore.set(key, valueForKey)
        }
      } else if (m1.has(dot) && !cc2.dotIn(dot)) {
        resultDotStore.set(dot, m1.get(dot))
      } else if (m2.has(dot) && !cc1.dotIn(dot)){
        resultDotStore.set(dot, m2.get(dot))
      }
    }
    return [resultDotStore, CausalContext.from(cc1).join(cc2)]
  }
}

module.exports = DotFunMap
