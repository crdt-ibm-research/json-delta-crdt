const {DotMap } = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray } = require('../../src/backend/crdts/unifiedCRDTs')
const JsonArray = require('../../src/backend/JsonObjects/JsonArray')
const JsonMap = require('../../src/backend/JsonObjects/JsonMap')
const JsonRegister = require('../../src/backend/JsonObjects/JsonRegister')
const CausalContext = require('../../src/backend/causal-context')

/**
 * Recursively creates Automerge versions of all the objects and nested
 * objects in `value`, and returns the object ID of the root object. If any
 * object is an existing Automerge object, its existing ID is returned.
 */
function genNestedObjectCreation(value) {
    if (Array.isArray(value)) {
        let f = function ([m,cc]) {
            // Create a new array object
            let newCC = CausalContext.from(cc)
            let deltaArray = ORArray.create([null, newCC])
            let orarray = [new DotMap(ORArray.typename()), newCC]
            orarray = DotMap.join(orarray, deltaArray)
            let i
            for (i  = 0;  i < value.length; i++) {
                const [currFunc, currType] = genNestedObjectCreation(value[i])
                let deltaMutator, delta
                if (currType === 'primitive') {
                    deltaMutator = JsonArray.insertValue(currFunc, i)
                } else if (currType === "map") {
                    deltaMutator = JsonArray.insertMap(currFunc, i)
                } else if (currType === "array") {
                    deltaMutator = JsonArray.insertArray(currFunc, i)
                }
                delta = deltaMutator(orarray)
                orarray = DotMap.join(orarray, delta)
            }
            return orarray
        }
        return [f, "array"]
    } else if (isObject(value)){
        let f = function ([m,cc]) {
            // Create a new map object
            let newCC = CausalContext.from(cc)
            let ormap = [new DotMap(ORMap.typename()), newCC]
            let deltaMap = ORMap.create([null, newCC])
            ormap = DotMap.join(ormap, deltaMap)
            for (let key of Object.keys(value)) {
                const [currFunc, currType] = genNestedObjectCreation(value[key])
                let deltaMutator, delta
                if (currType === 'primitive') {
                    deltaMutator = JsonMap.applyToValue(currFunc, key)
                } else if (currType === "map") {
                    deltaMutator = JsonMap.applyToMap(currFunc, key)
                } else if (currType === "array") {
                    deltaMutator = JsonMap.applyToArray(currFunc, key)
                }
                delta = deltaMutator(ormap)
                ormap = DotMap.join(ormap, delta)
            }
            return ormap
        }
        return [f, "map"]
    } else {
        return [JsonRegister.write(value), "primitive"]
    }
    return objectId
}

function isObject(obj) {
    return typeof obj === 'object' && obj !== null
}

module.exports = { genNestedObjectCreation }