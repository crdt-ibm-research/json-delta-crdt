'use strict'

const { assert } = require('chai');
const CausalContext = require('../causal-context')
const DotFun = require('./dot-fun');
const DotFunMap = require('./dot-fun-map');

class DotMap {
	constructor(typename, state) {
		this.typename = typename
		this.state = state || new Map() // {K: Any => V: DotStore}
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
  static join([m1, cc1], [m2 ,cc2]) {
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
		}	else if (type instanceof DotFunMap) {
			joinFunction = DotFunMap.join
		} else {
			joinFunction = DotFun.join
		}

		const res = joinFunction([left, cc1] , [right, cc2])
		const valueForKey = res[0]

      if (!valueForKey.isBottom()) {
        resM.state.set(key, valueForKey)
      }
	}
		
    return [resM, resCC]
	}

}

module.exports = DotMap