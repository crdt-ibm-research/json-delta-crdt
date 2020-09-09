'use strict'

const { assert } = require('chai')

const DotMap = require('../dotstores/dot-map')
const DotFun = require('../dotstores/dot-fun')
const CausalContext = require('../causal-context')
const MVReg = require('./mvreg')

class ORMap {
    static typename() {
        return "or-map"
    }

    static value([m, cc]) {
        assert(m instanceof DotMap)

        let retMap = {}
        for (let [key, value] of m.state.entries()) {
            if (key === "_alive") continue
            const type = m.get(key).typename
            switch (type) {
                case ORMap.typename():
                    value = ORMap.value([m.get(key), cc])
                    break;
                case MVReg.typename():
                    value = MVReg.value([m.get(key), cc])
                    break;
                default:
                    break;
            }

            retMap[key] = value
        }
        return retMap
    }

    static create([m,cc]) {
        m = m || new DotMap(ORMap.typename())

        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        const nextDot = cc.next()
        const dotFun = new DotFun().set(nextDot, true)
        const retDotMap = new DotMap(ORMap.typename(), new Map().set("_alive", dotFun))
        const retCC = new CausalContext().insertDot(nextDot)
        return [retDotMap, retCC]
    }

    static apply(o, k, [m,cc]) {
        m = m || new DotMap(ORMap.typename())

        assert(m instanceof DotMap)
        assert(m.typename === ORMap.typename())
        assert(cc instanceof CausalContext)

        const retDotMap = new DotMap(ORMap.typename())

        // First add _alive
        const nextDot = cc.next()
        const dotFun = new DotFun(MVReg.typename()).set(nextDot, true)
        retDotMap.set("_alive", dotFun)

        // Next call o (don't forget to add the dot to the CC)
        const [newV, retCC] = o([m.get(k), cc.insertDot(nextDot, true)])
        retDotMap.set(k ,newV)

        // Insert the dot of _alive
        retCC.insertDot(nextDot, true)
        return [retDotMap, retCC]
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

        const nextDot = cc.next()
        const dotFun = new DotFun().set(nextDot, true)
        const retDotMap = new DotMap(ORMap.typename(), new Map().set("_alive",dotFun))
        const retCC = new CausalContext().insertDot(nextDot).insertDots(m.dots())

        return [retDotMap, retCC]
    }
}

module.exports = ORMap