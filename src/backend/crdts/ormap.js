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

        // TODO: Add DotFun with key _alive_
        const nextDot = cc.next()
        const dotFun = new DotFun().set(nextDot, true)
        const retDotMap = new DotMap(ORMap.typename(), new Map().set("_alive", dotFun))
        const retCC = new CausalContext(cc.getID()).insertDot(nextDot)
        return [retDotMap, retCC]
    }

    static apply(o, k, [m,cc]) {
        m = m || new DotMap(ORMap.typename())

        assert(m instanceof DotMap)
        assert(m.typename === ORMap.typename())
        assert(cc instanceof CausalContext)

        // TODO: Add DotFun with key _alive_
        const [newV, retCC] = o([m.get(k), cc])
        const retDotMap = new DotMap(ORMap.typename(), new Map().set(k ,newV) )
        
        // TODO: Check with Arik cc.next() may already be allocated if this is a new key
        const nextDot = cc.next()
        const dotFun = new DotFun().set(nextDot, true)
        retDotMap.set("_alive", dotFun)
        retCC.insertDot(nextDot)
        return [retDotMap, retCC]
    }

    static remove(k, [m,cc]) {
        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        const retCC = new CausalContext(cc.getID()).insertDots(m.get(k).dots())
        return [new DotMap(ORMap.typename()), retCC]
    }

    static clear([m,cc]) {        
        assert(m instanceof DotMap)
        assert(cc instanceof CausalContext)

        // TODO: Add DotFun with key _alive_

        const nextDot = cc.next()
        const dotFun = new DotFun().set(nextDot, true)
        const retDotMap = new DotMap(ORMap.typename(), new Map().set("_alive",dotFun))
        const retCC = new CausalContext(cc.getID()).insertDot(nextDot).insertDots(m.dots())

        return [retDotMap, retCC]
    }
}

module.exports = ORMap