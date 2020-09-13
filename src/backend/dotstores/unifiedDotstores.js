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


  keys() {
    return Array.from(this.state, ([dot, value]) => dot)
  }

  values() {
    return Array.from(this.state, ([dot, value]) => value)
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


class DotFunMap {
  constructor (typename, state) {
    this.typename = typename
    this.state = state || new Map() // {K: I X N => V: DotStore}
  }

  static from(other) {
    return new DotFunMap(other.typename, new Map([...other.state]))
  }

  items() {
    return Array.from(this.state, ([dot, value]) => [dot, value])
  }

  keys() {
    return Array.from(this.state, ([dot, value]) => dot)
  }

  values() {
    return Array.from(this.state, ([dot, value]) => value)
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

        if (type instanceof DotFun) {
          joinFunction = DotFun.join
        }	else if (type instanceof DotFunMap) {
          joinFunction = DotFunMap.join
        } else {
          joinFunction = DotMap.join
        }

        const res = joinFunction([left, cc1] , [right, cc2])
        const valueForKey = res[0]

        if (!valueForKey.isBottom()) {
          resultDotStore.set(dot, valueForKey)
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


class DotMap {
	constructor(typename, state) {
		this.typename = typename
		this.state = state || new Map() // {K: Any => V: DotStore}
	}

	static from(other) {
		return new DotMap(other.typename, new Map([...other.state]))
	}

	dots() { // returns Set()
		const result = new Set()
		for (let value of this.state.values()) {
			let dots = value.dots()
			dots.forEach(result.add, result);
		}
		return result
	}

	isBottom() {
		return this.state.size === 0
	}

	size() {
		return this.state.size
	}

	has(key) {
		return this.state.has(key)
	}

	get(key) {
		return this.state.get(key)
	}

	set(key, value) {
		return this.state.set(key, value)
		this
	}

	// returns the join
	static join([m1, cc1], [m2, cc2]) {
		m1 = m1 || new DotMap()
		m2 = m2 || new DotMap()

		assert(m1 instanceof DotMap && m2 instanceof DotMap)
		assert(cc1 instanceof CausalContext && cc2 instanceof CausalContext)

		const resCC = CausalContext.from(cc1).join(cc2)

		const resM = new DotMap(m1.typename || m2.typename)

		const allKeys = new Set([...m1.state.keys(), ...m2.state.keys()])
		for (let key of allKeys) {
			let left = m1.get(key) // DotStore
			let right = m2.get(key) // DotStore

			const type = left || right
			let joinFunction;
			if (type instanceof DotMap) {
				joinFunction = DotMap.join
			} else if (type instanceof DotFunMap) {
				joinFunction = DotFunMap.join
			} else {
				joinFunction = DotFun.join
			}

			const res = joinFunction([left, cc1], [right, cc2])
			const valueForKey = res[0]

			if (!valueForKey.isBottom()) {
				resM.state.set(key, valueForKey)
			}
		}

		return [resM, resCC]
	}

}

module.exports = { DotMap, DotFunMap, DotFun }

