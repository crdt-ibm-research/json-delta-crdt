'use strict'

const { assert } = require('chai')

const DotMap = require('../dotstores/dot-map')
const CausalContext = require('../causal-context')
const MVReg = require('./mvreg')
const { ALIVE, MAP, ARRAY, VALUE, FIRST, SECOND } = require('../constants')
const DotFun = require('../dotstores/dot-fun')
const DotFunMap = require('../dotstores/dot-fun-map')

class ORArray {
	static typename() {
		return "or-array"
	}

	static value(pos, [m, cc]) {
		assert(m instanceof DotMap)
	}

	static create([m,cc]) {
		m = m || new DotMap(ORArray.typename())

		assert(m instanceof DotMap)
		assert(cc instanceof CausalContext)
		
		const [retFun, retCC] = MVReg.write(true, [m.get(ALIVE), cc])
		const retDotMap = new DotMap(ORMap.typename(), new Map().set(ALIVE, retFun))

		return [retDotMap, retCC]
	}

	static insert(uid, o, p, [m,cc]) {
		m = m || new DotMap(ORArray.typename())

		assert(m instanceof DotMap)
		assert(cc instanceof CausalContext)
		
		const [retFun, funCC] = MVReg.write(true, [m.get(ALIVE), cc])
		const retDotMap = new DotMap(ORArray.typename(), new Map().set(ALIVE, retFun))

		cc = CausalContext.from(cc).join(funCC)


		const [v, retCC] = o([m.get(uid), cc])

		d = CausalContext.from(cc).join(retCC).next()
		retCC.insert(d)

		const dotFun = new DotFun()
		dotFun.set(d, p)

		const dotFunMap = new DotFunMap()
		dotFunMap.set(d, dotFun)

		const pair = new DotMap()
		pair.set(FIRST, v)
		pair.set(SECOND, dotFunMap)

		retDotMap.set(uid, pair)

		return [retDotMap, CausalContext.from(funCC).join(retCC).insert(d)]
	}

	static apply(uid, o, p, [m,cc]) {

	}

	static move(uid, p, [m,cc]) {

	}

	static delete(uid, [m,cc]) {

	}

	static clear([m,cc]) {        

	}
}

module.exports = ORArray