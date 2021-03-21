'use strict'

const { assert } = require('chai')

const CausalContext = require('../causal-context')
const { DotMap, DotFunMap, DotFun } = require('../dotstores/unifiedDotstores')
//const DotFun = require('../dotstores/dot-fun')
//const DotMap = require('../dotstores/dot-map')
//const DotFunMap = require('../dotstores/dot-fun-map')
const { ALIVE, FIRST, SECOND, MAP, ARRAY, VALUE } = require('../constants')
const Position = require('../position')

class MVReg {
  static typename() {
    return "mvreg"
  }

  getTypeName() {
  	return MVReg.typename()
  }

  static values([m, c]) {
    const ret = new Set()
    for (let [, value] of m.items()) {
      ret.add(value)
    }
    return ret
  }

  // returns the value of the MVReg solving conlicts according to:
  // dot is [String, Integer], so first largest Integer then largest String
  static value([m, c]) {
    const max_dot = [...m.dots()].reduce(CausalContext.maxDot)
    return m.get(max_dot)
  }

  static write(value, [m, c]) {

	assert (c instanceof CausalContext)
    // handle undefined
    m = m || new DotFun(MVReg.typename())
    const dot = c.next()
    const newState = new DotFun(m.typename).set(dot, value)
    const newCC = new CausalContext(c.getID()).insertDot(dot).insertDots(m.dots())
    return [newState, newCC]
  }

  static clear([m, c]) {
    return [new DotFun(m.typename), new CausalContext().insertDots(m.dots())]
  }
}

class ORMap {
	static typename() {
		return "or-map"
	}

	getTypeName() {
		return ORMap.typename()
	}

	static getKey(m, key) {
		const innerMap = m.get(key)
		if (innerMap.has(MAP)) {
			return [innerMap.get(MAP), MAP]
		} else if (innerMap.has(ARRAY)) {
			return [innerMap.get(ARRAY), ARRAY]
		} else {
			return [innerMap.get(VALUE), VALUE]
		}
	}

	static value(target) {
		const [m, cc] = target
		assert(m instanceof DotMap)

		let retMap = {}

		for (let [key, value] of m.state.entries()) {
			if (key === ALIVE) continue
			const innerMap = m.get(key)
			if (innerMap.has(MAP)) {
				value = ORMap.value([innerMap.get(MAP), cc])
			} else if (innerMap.has(ARRAY)) {
				value = ORArray.value([innerMap.get(ARRAY), cc])
			} else {
				value = MVReg.values([innerMap.get(VALUE), cc])
			}

			retMap[key] = value
		}
		return retMap
	}

	static create([m,cc]) {
		m = m || new DotMap(ORMap.typename())

		assert(m instanceof DotMap)
		assert(cc instanceof CausalContext)
		
		const [retFun, retCC] = MVReg.write(true, [m.get(ALIVE), cc])
		const retDotMap = new DotMap(ORMap.typename(), new Map().set(ALIVE, retFun))

		return [retDotMap, retCC]
	}

	static applyToMap(o, k, [m,cc]) {
		const inner = function ([state,causalContext]) {return ORMap.apply(o, MAP, [state, causalContext])}
		const [retMap, retCC] = ORMap.apply(inner, k, [m,cc])
		// Recommitted a map, delete the other two
		if (m && m.get(k) && m.get(k).get(ARRAY)) {
			retCC.insertDots(m.get(k).get(ARRAY).dots())
		}
		if (m && m.get(k) && m.get(k).get(VALUE)) {
			retCC.insertDots(m.get(k).get(VALUE).dots())
		}
		return [retMap, retCC]
	}

	static applyToArray(o, k, [m,cc]) {
		const inner = function ([m,cc]) {return ORMap.apply(o, ARRAY, [m, cc])}
		const [retMap, retCC] = ORMap.apply(inner, k, [m,cc])
		
	    // Recommitted an array, delete the other two
		if (m && m.get(k) && m.get(k).get(MAP)) {
			retCC.insertDots(m.get(k).get(MAP).dots())
		}
		if (m && m.get(k) && m.get(k).get(VALUE)) {
			retCC.insertDots(m.get(k).get(VALUE).dots())
		}

		return [retMap, retCC]
	}

	static applyToValue(o, k, [m,cc]) {
		const inner = function ([m,cc]) {return ORMap.apply(o, VALUE, [m, cc])}
		const [retMap, retCC] = ORMap.apply(inner, k, [m,cc])
		
		// Recommitted a value, delete the other two
		if (m && m.get(k) && m.get(k).has(MAP)) {
			retCC.insertDots(m.get(k).get(MAP).dots())
		}
		if (m && m.get(k) && m.get(k).has(ARRAY)) {
			retCC.insertDots(m.get(k).get(ARRAY).dots())
		}

		return [retMap, retCC]
	}

	static apply(o, k, [m,cc]) {
		m = m || new DotMap(ORMap.typename())

		assert(m instanceof DotMap)
		assert(m.typename === ORMap.typename())
		assert(cc instanceof CausalContext)

		const tmpCC = CausalContext.from(cc)

		const retDotMap = new DotMap(ORMap.typename())

		// First add ALIVE
		const [fun, funCC] = MVReg.write(true, [m.get(ALIVE), tmpCC])
		retDotMap.set(ALIVE, fun)

		// Next call o (don't forget to add the dot to the CC)
		const [newV, retCC] = o([m.get(k), tmpCC.join(funCC)])
		retDotMap.set(k ,newV)

		return [retDotMap, retCC.join(funCC)]
	}

	static remove(k, [m,cc]) {
		if (!m || !m.get(k)) {
			return [new DotMap(ORMap.typename()), new CausalContext()]
		}

		assert(cc instanceof CausalContext)
		assert(m instanceof DotMap)

		const retCC = new CausalContext().insertDots(m.get(k).dots())
		return [new DotMap(ORMap.typename()), retCC]
	}

	static clear([m,cc]) {        
		assert(m instanceof DotMap)
		assert(cc instanceof CausalContext)

		const retDotMap = new DotMap(ORMap.typename())

		// First write ALIVE
		const [fun, funCC] = MVReg.write(true, [m.get(ALIVE), cc])
		retDotMap.set(ALIVE, fun)

		// Next remove all dots
		const retCC = funCC.insertDots(m.dots())

		return [retDotMap, retCC]
	}
}

class ORArray {
	static typename() {
		return "or-array"
	}

	getTypeName() {
		return ORArray.typename()
	}

	static getIdx(m, idx) {
		const result = []
		for (let [uid, pair] of m.state.entries()) {
            // get value
			if (uid === ALIVE) continue
            const innerMap = pair.get(FIRST)
            let v
            if (innerMap.has(MAP)) {
				v = [innerMap.get(MAP), MAP]
			} else if (innerMap.has(ARRAY)) {
				v = [innerMap.get(ARRAY), ARRAY]
			} else {
				v = [innerMap.get(VALUE), VALUE]
            }

            // get position
            const maxRoot = pair.get(SECOND).keys().reduce(CausalContext.maxDot)
            const maxDot = pair.get(SECOND).get(maxRoot).keys().reduce(CausalContext.maxDot)
            const p = pair.get(SECOND).get(maxRoot).get(maxDot)

			result.push([v, p])
        }
	
		result.sort((a, b) => Position.compare(a[1], b[1]))

        // sort the array
        let retArray = []
        for (let [v, p] of result) {
            retArray.push(v)
        }

		return retArray[idx]
	}

	static value([m, cc]) {
        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        const result = []
		for (let [uid, pair] of m.state.entries()) {
            // get value
            if (uid === ALIVE) continue
            const innerMap = pair.get(FIRST)
            let v
            if (innerMap.has(MAP)) {
				v = ORMap.value([innerMap.get(MAP), cc])
			} else if (innerMap.has(ARRAY)) {
				v = ORArray.value([innerMap.get(ARRAY), cc])
			} else {
				v = MVReg.values([innerMap.get(VALUE), cc])
            }
            
            // get position
            const maxRoot = pair.get(SECOND).keys().reduce(CausalContext.maxDot)
            const maxDot = pair.get(SECOND).get(maxRoot).keys().reduce(CausalContext.maxDot)
            const p = pair.get(SECOND).get(maxRoot).get(maxDot)

			result.push([v, p])
        }
	
		result.sort((a, b) => Position.compare(a[1], b[1]))

        // sort the array
        let retArray = []
        for (let [v, p] of result) {
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
			retCC.insertDots(m.get(uid).get(FIRST).get(MAP).dots())
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
			retCC.insertDots(m.get(uid).get(FIRST).get(ARRAY).dots())
        }

		return [retMap, retCC]
    }
    
    static insertMap(uid, o, p, [m,cc]) {
        const inner = function ([m,cc]) {return ORMap.apply(o, MAP, [m, cc])}
        return ORArray.insert(uid, inner, p, [m,cc])
    }

    static insertArray(uid, o, p, [m,cc]) {
        const inner = function ([m,cc]) {return ORMap.apply(o, ARRAY, [m, cc])}
        return ORArray.insert(uid, inner, p, [m,cc])
    }

    static insertValue(uid, o, p, [m,cc]) {
        const inner = function ([m,cc]) {return ORMap.apply(o, VALUE, [m, cc])}
        return ORArray.insert(uid, inner, p, [m,cc])
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
		retCC.insertDot(d, true)

		const dotFun = new DotFun()
		dotFun.set(d, p)

		const dotFunMap = new DotFunMap()
		dotFunMap.set(d, dotFun)

		const pair = new DotMap()
		pair.set(FIRST, v)
		pair.set(SECOND, dotFunMap)

		retDotMap.set(uid, pair)

		return [retDotMap, CausalContext.from(funCC).join(retCC).insertDot(d, true)]
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

        return [retDotMap, CausalContext.from(funCC).join(retCC).insertDot(d, true).join(roots)]
	}

	static move(uid, p, [m,cc]) {
		assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        const d = CausalContext.from(cc).next()
        //const children = m.get(uid).get(SECOND).values().reduce(function(a, b) {
        //    new CausalContext().insertDots(a.dots()).join(new CausalContext().insertDots(b.dots()))
        //})
        const children = m.get(uid).get(SECOND).dots()

        const ps = new DotFunMap()
        for (let r of m.get(uid).get(SECOND).keys()) {
            ps.set(r, new DotFun().set(d, p))
        }
        
        const pair = new DotMap()
        // no first - represents a bottom
        pair.set(SECOND, ps)

        const retDotMap = new DotMap(ORArray.typename(), new Map())
        retDotMap.set(uid, pair)

        return [retDotMap, new CausalContext().insertDot(d, true).insertDots(children)]
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

module.exports = {ORMap, MVReg , ORArray}