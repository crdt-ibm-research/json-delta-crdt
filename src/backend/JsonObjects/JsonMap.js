'use strict'

const { ORMap } = require("../crdts")

class JsonMap {

    static value(state) {
        return ORMap.value(state)
    }

	static create() {
        return function([m,cc]) { return ORMap.create([m,cc]) }
    }

    static applyToMap(o, k) {
        return function([m,cc]) { return ORMap.applyToMap(o, k, [m,cc]) }
    }

    static applyToArray(o, k) {
        return function([m,cc]) { return ORMap.applyToArray(o, k, [m,cc]) }
    }

    static applyToValue(o, k) {
        return function([m,cc]) { return ORMap.applyToValue(o, k, [m,cc]) }
    }

    static remove(k) {
        return function([m,cc]) { return ORMap.remove(k, [m,cc]) }
    }

    static clear() {
        return function([m,cc]) { return ORMap.clear([m,cc]) }
    }
}

module.exports = JsonMap