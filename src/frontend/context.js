const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')

const Position = require('../../src/backend/position')
const CausalContext = require('../../src/backend/causal-context')
const { VALUE } = require('../../src/backend/constants')

class Context {
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
            let orarray = [new DotMap(ORArray.typename()), cc]
            let replicaId = 'r1' //cc._id
            let i
            for (i  = 0;  i < value.length; i++) {
                console.log("val: ", value, " index: ", i, "val[key]: ", value[i])
                const [currFunc, currType] = Context.genNestedObjectCreation(value[i])
                let delta
                if (currType === 'primitive') {
                    // p = new Position( [ [ 150, 'r1' ] ])
                    delta = ORArray.insertValue([replicaId, i+1], currFunc, new Position([[i, replicaId]]), orarray)
                } else if (currType === "map") {
                    delta = ORArray.insertMap([replicaId, i+1], currFunc, new Position([[i, replicaId]]), orarray)
                } else if (currType === "array") {
                    delta = ORArray.insertArray([replicaId, i+1], currFunc, new Position([[i, replicaId]]), orarray)
                }
                orarray = DotMap.join(orarray, delta)
            }
            return orarray
        }
        return [f, "array"]
    } else if (isObject(value)){
      let f = function ([m,cc]) {
        // Create a new map object
        let ormap = [new DotMap(ORMap.typename()), cc]
        for (let key of Object.keys(value)) {
            console.log("val: ", value, " key: ", key, "val[key]: ", value[key])
            const [currFunc, currType] = Context.genNestedObjectCreation(value[key])
            let delta
            if (currType === 'primitive') {
                delta = ORMap.applyToValue(currFunc, key, ormap)
            } else if (currType === "map") {
                delta = ORMap.applyToMap(currFunc, key, ormap)
            } else if (currType === "array") {
                delta = ORMap.applyToArray(currFunc, key, ormap)
            }
            ormap = DotMap.join(ormap, delta)
        }
        return ormap
      }
      return [f, "map"]
    } else {
        console.log("primitive")
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
          return Context.genNestedObjectCreation(value)
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

module.exports = Context