const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../backend/causal-context')
const Peeler = require('./peeler')
const { MAP, ARRAY, VALUE } = require('../../src/backend/constants')
const { BACKEND } = require('../../src/frontend/constants')

const JsonArray = require('../../src/backend/JsonObjects/JsonArray')
const JsonMap = require('../../src/backend/JsonObjects/JsonMap')
const JsonRegister = require('../../src/backend/JsonObjects/JsonRegister')

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
        let { context, wrappedObject, mutatorsList, isRoot } = target
        if (isRoot) {
            const [m, cc] = context.doc
            wrappedObject = m
            mutatorsList = new Array()
        }

        let [val, type] = ORMap.getKey(wrappedObject, key)
        if (type === MAP) {
            mutatorsList.push(function (f) {
                return JsonMap.applyToMap(f, key)
            })
            /* mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToMap(f, key, [m, cc])
                }
            }) */
            return mapProxy(context, val, mutatorsList, false)
        } else if (type === ARRAY) {
            mutatorsList.push(function (f) {
                return JsonMap.applyToArray(f, key)
            })
            /* mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToMap(f, key, [m, cc])
                }
            }) */
            return listProxy(context, val, mutatorsList, false)
        } else if (type === VALUE) {
            mutatorsList.push(function (f) {
                return JsonMap.applyToValue(f, key)
            })
            /* mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToValue(f, key, [m, cc])
                }
            }) */
            return MVRProxy(context, val, mutatorsList)
        } else {
            throw new Error("Type not specified")
        }
    },

     set (target, key, value) {
        const { context, wrappedObject, mutatorsList, isRoot } = target
        let [mutator, type] = Peeler.genNestedObjectCreation(value)
        if (type === "map") {
            mutatorsList.push(function (f) {
                return JsonMap.applyToMap(f, key)
            })
            /* mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToMap(f, key, [m, cc])
                }
            }) */
        }  else if (type === "array") {
            mutatorsList.push(function (f) {
                return JsonMap.applyToArray(f, key)
            })
        } else if (type === "primitive") {
            mutatorsList.push(function (f) {
                return JsonMap.applyToValue(f, key)
            })
            /* mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToValue(f, key, [m, cc])
                }
            }) */

        }
        let i
        for (i  = mutatorsList.length - 1;  i >= 0; i--) {
            //console.log("in for-loop")
            mutator = mutatorsList[i](mutator)
        }
        const doc = context.doc
        let delta = mutator(doc)
        context.doc = DotMap.join(doc, delta)
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

const ListHandler = {
    get (target, prop) {
        //TODO: Check prop is an integer. If not, convert it.
        let { context, wrappedObject, mutatorsList, isRoot } = target
        if (isRoot) {
            const [m, cc] = context.doc
            wrappedObject = m
            mutatorsList = new Array()
        }
        let [val, type] = ORArray.getIdx(wrappedObject, prop)
        if (type === MAP) {
            mutatorsList.push(function (f) {
                return JsonArray.applyToMap(f, prop)
            })
            /* mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToMap(f, key, [m, cc])
                }
            }) */
            return mapProxy(context, val, mutatorsList, false)
        } else if (type === ARRAY) {
            mutatorsList.push(function (f) {
                return JsonArray.applyToArray(f, prop)
            })
            return listProxy(context, val, mutatorsList, false)
            //throw new Error("not implemented yet")
        } else if (type === VALUE) {
            mutatorsList.push(function (f) {
                return JsonArray.applyToValue(f, prop)
            })
            /* mutatorsList.push(function (f) {
                return function ([m, cc]) {
                    return ORMap.applyToValue(f, key, [m, cc])
                }
            }) */
            return MVRProxy(context, val, mutatorsList)
        } else {
            throw new Error("Type not specified")
        }
    },
     set (target, prop, value) {
        const { context, wrappedObject, mutatorsList, isRoot } = target
        let [mutator, type] = Peeler.genNestedObjectCreation(value)
        let insertFunc;
        let applyFunc;
        if (type === "map") {
            insertFunc = JsonArray.insertMap
            applyFunc = JsonArray.applyToMap
        } else if (type === "array") {
            insertFunc = JsonArray.insertArray
            applyFunc = JsonArray.applyToArray
        } else {
            insertFunc = JsonArray.insertValue
            applyFunc = JsonArray.applyToValue
        }

        if (prop == (target.wrappedObject.state.size - 1) ) { // Take into account Alive key
            // This is a new idx. Add it
            mutatorsList.push(function (f) {
                return insertFunc(f, prop)
            })
        } else {
            // This is an updating index. Update it
            mutatorsList.push(function (f) {
                return applyFunc(f, prop)
            })
        }

        let i
        for (i  = mutatorsList.length - 1;  i >= 0; i--) {
            mutator = mutatorsList[i](mutator)
        }
        const doc = context.doc
        let delta = mutator(doc)
        context.doc = DotMap.join(doc, delta)
        return true
    },
}

function basicProxyMatcher(m, c, type) {
    if (type === MAP) {
        return new Proxy({m, c}, BasicMapHandler)
    } else if (type === ARRAY) {
        return new Proxy({m, c}, BasicArrayHandler)
    } else if (type === VALUE) {
        return MVReg.value([m, c])
    } else {
        throw new Error("Type not specified")
    }
}

const FrontendHandler = {
    get (target, key) {
        if (typeof key === "symbol") {
            return target[key]
        } else {
            let [m, c] = target[BACKEND].getState()
            let proxyToBackend = new Proxy({m, c}, BasicMapHandler)
            // Let the proxy do the logic of lookup
            return proxyToBackend[key]
        }
    },
}

const BasicMapHandler = {
    get (target, key) {
        const { m, c } = target
        let [val, type] = ORMap.getKey(m, key)
        return basicProxyMatcher(val, c, type)
    },
}

const BasicArrayHandler = {
    get (target, prop) {
        //TODO: Check prop is an integer. If not, convert it.
        const { m, c } = target
        let [val, type] = ORArray.getIdx(m, prop)
        return basicProxyMatcher(val, c, type)
    },
}

/**
 * @param context: a reference to doc (which is [m, cc] of the top level)
 * @param wrappedObject: The object actually wrapped by the proxy (the actual map)
 * @param mutatorsList: list of delta operations from top to current level
 * @param isRoot: boolean, determine if this proxy is the root proxy
 * @returns {{mutatorsList: *, context: *, wrappedObject: *}}
 */
function mapProxy(context, wrappedObject, mutatorsList, isRoot) {
    return new Proxy({context, wrappedObject, mutatorsList, isRoot}, MapHandler)
}

/**
 * @param context: a reference to doc (which is [m, cc] of the top level)
 * @param wrappedObject: The object actually wrapped by the proxy (the actual map)
 * @param mutatorsList: list of delta operations from top to current level
 * @param isRoot: boolean, determine if this proxy is the root proxy
 * @returns {{mutatorsList: *, context: *, wrappedObject: *}}
 */
function listProxy(context, wrappedObject, mutatorsList, isRoot) {
    return new Proxy({context, wrappedObject, mutatorsList, isRoot}, ListHandler)
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

module.exports = { createRootObjectProxy, FrontendHandler }
