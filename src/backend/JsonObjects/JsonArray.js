'use strict'


//const ORArray = require("../crdts/orarray")
const { ORArray } = require("../crdts/unifiedCRDTs")
const Position = require("../position")
const { assert } = require('chai');
const { DotMap, DotFunMap, DotFun } = require('../dotstores/unifiedDotstores');
const CausalContext = require("../causal-context");
const { ALIVE } = require("../constants");

class JsonArray {
    static value(state) {
        return ORArray.value(state)
    }

    
	static create() {
        return function([m,cc]) { return ORArray.create([m,cc]) }
    }

    static insertMap(o, idx) {
        // TODO: Get position and uid from p
        return function([m,cc]) {
            const uid = cc.next()
            const p = _createPositionForIndex([m, cc], idx)
            return ORArray.insertMap(uid, o ,p, [m,cc])
        }
    }

    static insertArray(o, idx) {
        // TODO: Get position and uid from p
        return function([m,cc]) {
            const uid = cc.next()
            const p = _createPositionForIndex([m, cc], idx)
            return ORArray.insertArray(uid, o ,p, [m,cc])
        }
    }

    static insertValue(o, idx) {
        // TODO: Get position and uid from p
        return function([m,cc]) {
            const uid = cc.next()
            const p = _createPositionForIndex([m, cc], idx)
            return ORArray.insertValue(uid, o ,p, [m,cc])
        }
    }

    static applyToMap(o, idx) {
        // TODO: Get position and uid from p
        return function([m,cc]) {
            const uid = _uidFromIndex([m, cc], idx)
            const p = _getPosFromIndex([m, cc], idx)
            return ORArray.applyToMap(uid, o ,p, [m,cc])
        }
        return function([m,cc]) { return ORArray.applyToMap(uid, o ,p, [m,cc]) }
    }

    static applyToArray(o, idx) {
        // TODO: Get position and uid from p
        return function([m,cc]) {
            const uid = _uidFromIndex([m, cc], idx)
            const p = _getPosFromIndex([m, cc], idx)
            return ORArray.applyToArray(uid, o ,p, [m,cc])
        }
        return function([m,cc]) { 
            return ORArray.applyToArray(uid, o ,p, [m,cc]) 
        }
    }

    static applyToValue(o, idx) {
        // TODO: Get position and uid from p
        return function([m,cc]) {
            const uid = _uidFromIndex([m, cc], idx)
            const p = _getPosFromIndex([m, cc], idx)
            return ORArray.applyToValue(uid, o ,p, [m,cc])
        }
        return function([m,cc]) { return ORArray.applyToValue(uid, o ,p, [m,cc]) }
    }

    static move(from, to) {

        // TODO: Get uid from from and get position from to
        return function([m,cc]) {
            const uid = _uidFromIndex([m, cc], from)
            const p = _createPositionForIndex([m, cc], to)
            return ORArray.applyToValue(uid, o ,p, [m,cc])
        }
        return function([m,cc]) { return ORArray.move(uid,p, [m,cc]) }
    }

    static delete(idx) {
        //TODO: Get uid from p
        return function([m,cc]) {
            const uid = _uidFromIndex([m, cc], idx)
            return ORArray.delete(uid, [m,cc])
        }
        return function([m,cc]) { return ORArray.delete(uid, [m,cc]) }
    }

    static clear() {
        return function([m,cc]) { return ORArray.clear([m,cc]) }
    }
}

function _ids([m, cc]) {
    assert(m instanceof DotMap)
    assert(cc instanceof CausalContext)

    const result = []
    for (let [uid, pair] of m.state.entries()) {
        // get value
        if (uid === ALIVE) continue
        // get position
        const maxRoot = pair.get(SECOND).keys().reduce(CausalContext.maxDot)
        const maxDot = pair.get(SECOND).get(maxRoot).keys().reduce(CausalContext.maxDot)
        const p = pair.get(SECOND).get(maxRoot).get(maxDot)
        result.push({"id" : uid, "positions" : p})
    }

    result.sort((a, b) => Position.compare(a.positions[0], b.positions[0]))
    return result
}

function _createPositionForIndex(state, index) {
    let ids = _ids(state)
    const [m, cc] = state
    if (ids.length === 0) {
        return Position.between(cc.getID())
    }
    const posAtIndex = (index < l.length) ? l[index].positions[0] : undefined
    const posAtPreviousIndex = (index > 0) ? l[index - 1].positions[0] : undefined
    return Position.between(cc.getID(), posAtPreviousIndex, posAtIndex)
}

function _getPosFromIndex(state, index) {
    let ids = _ids(state)
    return ids[index].positions
}

function _uidFromIndex(state, index) {
    let ids = _ids(state)
    return ids[index].id
}

module.exports = JsonArray