const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const JsonArray = require('../../src/backend/JsonObjects/JsonArray')
const JsonMap = require('../../src/backend/JsonObjects/JsonMap')
const JsonRegister = require('../../src/backend/JsonObjects/JsonRegister')

const Position = require('../../src/backend/position')
const CausalContext = require('../../src/backend/causal-context')
const { VALUE } = require('../../src/backend/constants')

class Peeler {
    constructor() {
        // maps UUID to (parent-uuid, parent-type, my-identifier-in-parent)
        this.backtrackMap = new Map()
    }
    
    /**
   * Recursively creates Automerge versions of all the objects and nested
   * objects in `value`, and returns the object ID of the root object. If any
   * object is an existing Automerge object, its existing ID is returned.
   */
  static genNestedObjectCreation(value) {
    if (Array.isArray(value)) {
        let f = function ([m,cc]) {
            // Create a new map object
            let newCC = CausalContext.from(cc)
            let deltaArray = ORArray.create([null, newCC])
            let orarray = [new DotMap(ORArray.typename()), cc]
            orarray = DotMap.join(orarray, deltaArray)
            let i
            for (i  = 0;  i < value.length; i++) {
                const [currFunc, currType] = Peeler.genNestedObjectCreation(value[i])
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
            const [currFunc, currType] = Peeler.genNestedObjectCreation(value[key])
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

  static genSetValue(value) {
      if (isObject(value)) {
          // another nesting, get the creation func
          return Peeler.genNestedObjectCreation(value)
      } else {
          // we have a primitive
          const f = function ([m,cc]) {
                return MVReg.write(value, [m,cc])	
            }
        return [f, "primitive"]    
      }
  }
}

function isObject(obj) {
    return typeof obj === 'object' && obj !== null
}

module.exports = Peeler