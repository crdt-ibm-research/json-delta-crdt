'use strict'

const { assert } = require('chai')

const DotMap = require('../dotstores/dot-map')
const CausalContext = require('../causal-context')
const MVReg = require('./mvreg')
const { ALIVE, FIRST, SECOND, ARRAY, VALUE } = require('../constants')
const DotFun = require('../dotstores/dot-fun')
const DotFunMap = require('../dotstores/dot-fun-map')
const ORMap = require('./ormap')

class ORArray {
	static typename() {
		return "or-array"
	}

	static value([m, cc]) {
        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        let tmpArray = []
		for (let [uid, pair] of m.state.entries()) {
            // get value
            if (uid === ALIVE) continue
            const innerMap = pair.get(FIRST)
            let v
            if (innerMap.has(MAP)) {
				v = ORMap.value([innerMap.get(MAP), cc])
			} else if (innerMap.has(ARRAY)) {
				v = ORArray.values([innerMap.get(ARRAY), cc])
			} else {
				v = MVReg.values([innerMap.get(VALUE), cc])
            }
            
            // get position
            const maxRoot = pair.get(SECOND).keys().reduce(CausalContext.maxDot)
            const maxDot = pair.get(SECOND).get(maxRoot).keys().reduce(CausalContext.maxDot)
            const p = pair.get(SECOND).get(maxRoot).get(maxDot)
            
			tmpArray.push([v, p])
        }

        // sort the array
        let retArray
        for (let [v, p] of tmpArray.sort((a, b) => a[1] - b[1])) {
            retArray.push(v)
        }

		return retArray
	}

	static create([m,cc]) {
		m = m || new DotMap(ORArray.typename())

		assert(m instanceof DotMap)
		assert(cc instanceof CausalContext)
		
		const [retFun, retCC] = MVReg.write(true, [m.get(ALIVE), cc])
		const retDotMap = new DotMap(ORMap.typename(), new Map().set(ALIVE, retFun))

		return [retDotMap, retCC]
    }
    
    static applyToMap(uid, o, p, [m,cc]) {
		const inner = function ([m,cc]) {return ORMap.apply(o, MAP, [m, cc])}
		const [retMap, retCC] = ORArray.apply(uid, inner, p, [m,cc])

		// Recommitted a map, delete the other two
		if (m.get(uid) && m.get(uid).get(FIRST).get(ARRAY)) {
			retCC.insertDots(m.get(uid).get(FIRST).get(ARRAY).dots())
		}
		if (m.get(uid) && m.get(uid).get(FIRST).get(VALUE)) {
			retCC.insertDots(m.get(uid).get(FIRST).get(VALUE).dots())
		}

		return [retMap, retCC]
    }
    
    static applyToArray(uid, o, p, [m,cc]) {
        const inner = function ([m,cc]) {return ORMap.apply(o, ARRAY, [m, cc])}
		const [retMap, retCC] = ORArray.apply(uid, inner, p, [m,cc])
		
        // Recommitted an array, delete the other two
        if (m.get(uid) && m.get(uid).get(FIRST).get(MAP)) {
			retCC.insertDots(m.get(uid).get(FIRST).get(ARRAY).dots())
		}
		if (m.get(uid) && m.get(uid).get(FIRST).get(VALUE)) {
			retCC.insertDots(m.get(uid).get(FIRST).get(VALUE).dots())
        }

		return [retMap, retCC]
    }
    
    static applyToValue(uid, o, p, [m,cc]) {
        const inner = function ([m,cc]) {return ORMap.apply(o, VALUE, [m, cc])}
		const [retMap, retCC] = ORArray.apply(uid, inner, p, [m,cc])
		
        // Recommitted a value, delete the other two
        if (m.get(uid) && m.get(uid).get(FIRST).get(MAP)) {
			retCC.insertDots(m.get(uid).get(FIRST).get(MAP).dots())
		}
		if (m.get(uid) && m.get(uid).get(FIRST).get(ARRAY)) {
			retCC.insertDots(m.get(uid).get(FIRST).get(VALUE).dots())
        }

		return [retMap, retCC]
	}

	static insert(uid, o, p, [m,cc]) {
		m = m || new DotMap(ORArray.typename())

		assert(m instanceof DotMap)
		assert(cc instanceof CausalContext)
		
		const [retFun, funCC] = MVReg.write(true, [m.get(ALIVE), cc])
		const retDotMap = new DotMap(ORArray.typename(), new Map().set(ALIVE, retFun))

		cc = CausalContext.from(cc).join(funCC)

		const [v, retCC] = o([m.get(uid), cc])

		const d = CausalContext.from(cc).join(retCC).next()
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
        m = m || new DotMap(ORArray.typename())

		assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        // First add ALIVE
        const [retFun, funCC] = MVReg.write(true, [m.get(ALIVE), cc])
        const retDotMap = new DotMap(ORArray.typename(), new Map().set(ALIVE, retFun))
        
        cc = CausalContext.from(cc).join(funCC)
        
        const [v, retCC] = o([m.get(uid).get(FIRST), cc])
        const d = CausalContext.from(cc).join(retCC).next()

        const dotFun = new DotFun()
		dotFun.set(d, p)

		const dotFunMap = new DotFunMap()
		dotFunMap.set(d, dotFun)

		const pair = new DotMap()
		pair.set(FIRST, v)
        pair.set(SECOND, dotFunMap)
        
        retDotMap.set(uid, pair)

        let roots = new CausalContext().insertDots(m.get(uid).get(SECOND).keys())

        return [retDotMap, CausalContext.from(funCC).join(retCC).insert(d).join(roots)]
	}

	static move(uid, p, [m,cc]) {
		assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        const d = CausalContext.from(cc).next()
        const children = m.get(uid).get(SECOND).values().reduce(function(a, b) {
            new CausalContext().insertDots(a.dots()).join(new CausalContext().insertDots(b.dots()))
        })

        const ps = new DotFunMap()
        for (let r of m.get(uid).get(SECOND).keys()) {
            ps.set(r, new DotFun().set(d, p))
        }
        
        const pair = new DotMap()
        // no first - represents a bottom
        pair.set(SECOND, ps)

        const retDotMap = new DotMap(ORArray.typename(), new Map())
        retDotMap.set(uid, pair)

        return [retDotMap, CausalContext.from(cc).insert(d).join(children)]
	}

	static delete(uid, [m,cc]) {
        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        const retDotMap = new DotMap(ORArray.typename(), new Map())

        return [retDotMap, new CausalContext().insertDots(m.get(uid).dots())]
	}

	static clear([m,cc]) {  
        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        const retDotMap = new DotMap(ORArray.typename(), new Map())

        return [retDotMap, new CausalContext().insertDots(m.dots())]
	}
}

module.exports = ORArray