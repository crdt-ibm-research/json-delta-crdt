const DotMap = require('../../src/backend/dotstores/dot-map')
const ORMap = require('../../src/backend/crdts/ormap')
const CausalContext = require('../../src/backend/causal-context')
const MVReg = require('../../src/backend/crdts/mvreg')
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

    } else {
      // Create a new map object
      let f = function ([m,cc]) {	
        let ormap = [new DotMap(ORMap.typename()), cc] 
        for (let key of Object.keys(value)) {
            console.log("val: ", value, " key: ", key, "val[key]: ", value[key])
            const [currFunc, currType] = Context.genSetValue(value[key])
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
    }

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