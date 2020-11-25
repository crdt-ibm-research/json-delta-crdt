const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../backend/causal-context')
const Peeler = require('./peeler')
const { MAP, ARRAY, VALUE } = require('../../src/backend/constants')

const MVRHandler = {}

/*
 * TODO: add support for partial path. That is:
 *  d = doc.a.b.c.d
 *  d.e = 1
 *  console.log(d.values())
 */


// wrappedObject == m (not cc)
// context = {doc: [m, cc] } where m is the top level document
const MapHandler = {
    get (target, key) {
        console.log("key: ", key)
        let { context, wrappedObject, mutatorsList, isRoot } = target
        //console.log("wrappedObject: ", wrappedObject)
        //console.log("wrappedObject values: ", ORMap.value(wrappedObject))

        if (isRoot) {
            const [m, cc] = context.doc
            wrappedObject = m
            mutatorsList = new Array()
        }

        let [val, type] = ORMap.getKey(wrappedObject, key)
        if (type === MAP) {
            mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToMap(f, key, [m, cc])
                }
            })
            return mapProxy(context, val, mutatorsList, false)
        } else if (type === ARRAY) {
            throw new Error("not implemented yet")
        } else if (type === VALUE) {
            mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToValue(f, key, [m, cc])
                }
            })
            return MVRProxy(context, val, mutatorsList)
        } else {
            throw new Error("Type not specified")
        }
    },

     set (target, key, value) {
        const { context, wrappedObject, mutatorsList, isRoot } = target
        let [mutator, type] = Peeler.genNestedObjectCreation(value)
        //console.log("mutator: ", mutator)
        if (type === "map") {
            mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToMap(f, key, [m, cc])
                }
            })
        }  else if (type === "array") {
            throw new Error("not implemented yet")
        } else if (type === "primitive") {
            mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToValue(f, key, [m, cc])
                }
            })
        }
        let i
        for (i  = mutatorsList.length - 1;  i >= 0; i--) {
            //console.log("in for-loop")
            mutator = mutatorsList[i](mutator)
        }
        const doc = context.doc
        let delta = mutator(doc)
        //console.log("Set: delta: ", ORMap.value(delta))
        context.doc = DotMap.join(doc, delta)
        //console.log("Set: after join, context.doc: ", ORMap.value(context.doc))
        console.log("finished set")
        return true
    },
    //
    // deleteProperty (target, key) {
    //     throw new Error("deleteProperty is not implemented yet")
    //     /*
    //     const { context, objectId, readonly } = target
    //     if (Array.isArray(readonly) && readonly.indexOf(key) >= 0) {
    //         throw new RangeError(`Object property "${key}" cannot be modified`)
    //     }
    //     context.deleteMapKey(objectId, key)
    //     return true
    //      */
    // },
    //
    // has (target, key) {
    //     throw new Error("has is not implemented yet")
    //     /*
    //     const { context, objectId } = target
    //     return [OBJECT_ID, CHANGE].includes(key) || (key in context.getObject(objectId))
    //      */
    // },
    //
    // getOwnPropertyDescriptor (target, key) {
    //     throw new Error("getOwnPropertyDescriptor is not implemented yet")
    //     /*
    //     const { context, objectId } = target
    //     const object = context.getObject(objectId)
    //     if (key in object) {
    //         return {
    //             configurable: true, enumerable: true,
    //             value: context.getObjectField(objectId, key)
    //         }
    //     }
    //      */
    // },
    //
    ownKeys (target) {
        let { context, wrappedObject, mutatorsList, isRoot } = target
        if (isRoot) {
            const [m, cc] = context.doc
            wrappedObject = m
            // console.log("reflect: ", Reflect.ownKeys((wrappedObject.state)))

        }
        console.log("ownKeys-1: ", wrappedObject.getKeys())
        console.log("ownKeys-2: ", wrappedObject.state.keys())
        console.log("ownKeys-3: ", wrappedObject.state.entries())
        let iter = wrappedObject.getKeys()

        //return wrappedObject.getKeys()
        return wrappedObject.state.entries()
        /*
        const { context, objectId } = target
        return Object.keys(context.getObject(objectId))
         */
    },
    getOwnPropertyDescriptor(target, k) {
        return {
            enumerable: true,
            configurable: true,
        };
    }
}


/**
 * @param context: a reference to doc (which is [m, cc] of the top level)
 * @param wrappedObject: The object actually wrapped by the proxy (the actual map)
 * @param mutatorsList: list of delta operations from top to current level
 * @param isRoot: boolean, determine if this proxy is the root proxy
 * @returns {{mutatorsList: *, context: *, wrappedObject: *}}
 */
function mapProxy(context, wrappedObject, mutatorsList, isRoot) {
    //console.log("wrappedObject:", wrappedObject)
    return new Proxy({context, wrappedObject, mutatorsList, isRoot}, MapHandler)
}

function MVRProxy(context, wrappedObject, mutatorsList) {
    return new Proxy({context, wrappedObject, mutatorsList}, MVRHandler)
}

// @param context: a reference to [m, cc]
function createRootObjectProxy(context) {
    const mutatorList = new Array()
    let [m, cc] = context.doc
    return mapProxy(context, m, mutatorList, true)
}

/**
 * Instantiates a proxy object for the given `objectId`.
 * This function is added as a method to the context object by rootObjectProxy().
 * When it is called, `this` is the context object.
 * `readonly` is a list of map property names that cannot be modified.
 */
function instantiateProxy(objectId, readonly) {
    const object = this.getObject(objectId)
    if (Array.isArray(object)) {
        return listProxy(this, objectId)
    } else if (object instanceof Text || object instanceof Table) {
        return object.getWriteable(this)
    } else {
        return mapProxy(this, objectId, readonly)
    }
}

module.exports = { createRootObjectProxy }