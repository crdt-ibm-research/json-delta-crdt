const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const JsonArray = require('../../src/backend/JsonObjects/JsonArray')
const JsonMap = require('../../src/backend/JsonObjects/JsonMap')
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
    /*
    if (typeof value[OBJECT_ID] === 'string') {
      throw new TypeError(
        'Cannot assign an object that already belongs to an Automerge document. ' +
        'See https://github.com/automerge/automerge#making-fine-grained-changes')
    }
    */
    //const objectId = uuid()
    if (Array.isArray(value)) {
        let f = function ([m,cc]) {
            // Create a new map object
            let newCC = CausalContext.from(cc)
            let deltaArray = ORArray.create([null, newCC])
            let orarray = [new DotMap(ORArray.typename()), cc]
            orarray = DotMap.join(orarray, deltaArray)

            
            let replicaId = 'r1' //cc._id
            let i
            for (i  = 0;  i < value.length; i++) {
                console.log("val: ", value, " index: ", i, "val[key]: ", value[i])
                const [currFunc, currType] = Peeler.genNestedObjectCreation(value[i])
                let deltaMutator, delta
                if (currType === 'primitive') {
                    // p = new Position( [ [ 150, 'r1' ] ])
                    //delta = ORArray.insertValue([replicaId, i+1], currFunc, new Position([[i, replicaId]]), orarray)
                    deltaMutator = JsonArray.insertValue(currFunc, i)
                } else if (currType === "map") {
                    deltaMutator = JsonArray.insertMap(currFunc, i)
                    //delta = ORArray.insertMap([replicaId, i+1], currFunc, new Position([[i, replicaId]]), orarray)
                } else if (currType === "array") {
                    deltaMutator = JsonArray.insertArray(currFunc, i)
                    //delta = ORArray.insertArray([replicaId, i+1], currFunc, new Position([[i, replicaId]]), orarray)
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
            //console.log("Adding key:", key)
            //console.log("Adding value:", value[key])
            const [currFunc, currType] = Peeler.genNestedObjectCreation(value[key])
            let deltaMutator, delta
            if (currType === 'primitive') {
                deltaMutator = JsonMap.applyToValue(currFunc, key)
                //delta = ORMap.applyToValue(currFunc, key, ormap)
            } else if (currType === "map") {
                deltaMutator = JsonMap.applyToMap(currFunc, key)

                //delta = ORMap.applyToMap(currFunc, key, ormap)
            } else if (currType === "array") {
                deltaMutator = JsonMap.applyToArray(currFunc, key)

                //delta = ORMap.applyToArray(currFunc, key, ormap)
            }

            delta = deltaMutator(ormap)
            //console.log("Before delta:", delta)

            //console.log("ormap:", ormap[1])
            //console.log("delta:", delta[1])
            ormap = DotMap.join(ormap, delta)
            //console.log("After:", ormap)

        }
        //console.log("Final:", ormap)
        return ormap
      }
      return [f, "map"]
    } else {
        const f = function ([m,cc]) {
            return MVReg.write(value, [m,cc])
        }
        return [f, "primitive"]
    }

    console.log("zin ba-eyein")
    return objectId
  }

  static genSetValue(value) {
    console.log(value)
      console.log(isObject(value))
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