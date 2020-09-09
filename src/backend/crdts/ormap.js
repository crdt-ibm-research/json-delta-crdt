'use strict'

const { assert } = require('chai')

const DotMap = require('../dotstores/dot-map')
const CausalContext = require('../causal-context')
const MVReg = require('./mvreg')
const { ALIVE, MAP, ARRAY, VALUE } = require('../constants')

class ORMap {
    static typename() {
        return "or-map"
    }

    static value([m, cc]) {
        assert(m instanceof DotMap)

        let retMap = {}
        for (let [key, value] of m.state.entries()) {
            if (key === ALIVE) continue
            const innerMap = m.get(key)
            if (innerMap.has(MAP)) {
                value = ORMap.value([innerMap.get(MAP), cc])
            } else if (innerMap.has(ARRAY)) {
                value = ORArray.values([innerMap.get(ARRAY), cc])
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
        // TODO: Delete other two
        const inner = function ([m,cc]) {return ORMap.apply(o, MAP, [m, cc])}
        return ORMap.apply(inner, k, [m,cc])
    }

    static applyToArray(o, k, [m,cc]) {
        // TODO: Delete other two
        const inner = function ([m,cc]) {return ORMap.apply(o, ARRAY, [m, cc])}
        return ORMap.apply(inner, k, [m,cc])
    }

    static applyToValue(o, k, [m,cc]) {
        // TODO: Delete other two
        const inner = function ([m,cc]) {return ORMap.apply(o, VALUE, [m, cc])}
        return ORMap.apply(inner, k, [m,cc])
    }

    static apply(o, k, [m,cc]) {
        m = m || new DotMap(ORMap.typename())

        assert(m instanceof DotMap)
        assert(m.typename === ORMap.typename())
        assert(cc instanceof CausalContext)

        const retDotMap = new DotMap(ORMap.typename())

        // First add ALIVE
        const [fun, funCC] = MVReg.write(true, [m.get(ALIVE), cc])
        retDotMap.set(ALIVE, fun)

        // Next call o (don't forget to add the dot to the CC)
        const [newV, retCC] = o([m.get(k), cc.join(funCC)])
        retDotMap.set(k ,newV)

        return [retDotMap, retCC.join(funCC)]
    }

    static remove(k, [m,cc]) {
        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

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

module.exports = ORMap