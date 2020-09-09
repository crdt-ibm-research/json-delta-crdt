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
    if (typeof value[OBJECT_ID] === 'string') {
      throw new TypeError(
        'Cannot assign an object that already belongs to an Automerge document. ' +
        'See https://github.com/automerge/automerge#making-fine-grained-changes')
    }
    const objectId = uuid()

    if (Array.isArray(value)) {

    } else {
      // Create a new map object
      let f = function ([m,cc]) {	
        let ormap = [new DotMap(ORMap.typename()), cc] 
        for (let key of Object.keys(value)) {
            const [currFunc, currType] = genSetValue(value.get(key))
            let delta
            if (currType === 'primitive') {
                delta = ORMap.applyToValue(f, key, ormap)
            } else if (currType === "map") {
                delta = ORMap.applyToMap(f, key, ormap)
            } else if (currType === "array") {
                delta = ORMap.applyToArray(f, key, ormap)
            }
            ormap = ORMap.join(ormap, delta)
        }
        return ormap
      }
      return [f, "map"]
    }

    return objectId
  }

  static genSetValue(value) {
      if (typeof value !== 'string') {
          throw new TypeError("keys can only be strings!")
      }
      if (isObject(value)) {
          // another nesting, get the creation func
          return genNestedObjectCreation(value)
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