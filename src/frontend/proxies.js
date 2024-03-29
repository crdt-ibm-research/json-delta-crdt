const { DotMap } = require("../backend/dotstores");
const { ORMap, ORArray, MVReg } = require("../backend/crdts");
const Peeler = require("./peeler");
const { MAP, ARRAY, VALUE } = require("../backend/utils/constants");
const { BACKEND } = require("../../src/frontend/constants");

const JsonArray = require("../../src/backend/JsonObjects/JsonArray");
const JsonMap = require("../../src/backend/JsonObjects/JsonMap");

const MVRHandler = {};

/*
 * TODO: add support for partial path. That is:
 *  d = doc.a.b.c.d
 *  d.e = 1
 *  console.log(d.values())
 */

const MapHandler = {
  get(target, key, ...receiver) {
    let { context, wrappedObject, mutatorsList, isRoot } = target;
    if (isRoot) {
      const [m, cc] = context.doc;
      wrappedObject = m;
      mutatorsList = new Array();
    }

    let [val, type] = ORMap.getKey(wrappedObject, key);
    if (type === MAP) {
      mutatorsList.push(function (f) {
        return JsonMap.applyToMap(f, key);
      });
      return mapProxy(context, val, mutatorsList, false);
    } else if (type === ARRAY) {
      mutatorsList.push(function (f) {
        return JsonMap.applyToArray(f, key);
      });
      return listProxy(context, val, mutatorsList, false, receiver);
    } else if (type === VALUE) {
      mutatorsList.push(function (f) {
        return JsonMap.applyToValue(f, key);
      });
      return MVRProxy(context, val, mutatorsList);
    } else {
      throw new Error("Type not specified");
    }
  },
  set(target, key, value) {
    const { context, wrappedObject, mutatorsList, isRoot } = target;
    let [mutator, type] = Peeler.genNestedObjectCreation(value);

    let clearMutator = JsonMap.remove(key);
    let i;
    for (i = mutatorsList.length - 1; i >= 0; i--) {
      clearMutator = mutatorsList[i](clearMutator);
    }
    const doc = context.doc;
    let clearDelta = clearMutator(doc);

    if (type === "map") {
      mutatorsList.push(function (f) {
        return JsonMap.applyToMap(f, key);
      });
    } else if (type === "array") {
      mutatorsList.push(function (f) {
        return JsonMap.applyToArray(f, key);
      });
    } else if (type === "primitive") {
      mutatorsList.push(function (f) {
        return JsonMap.applyToValue(f, key);
      });
    }
    for (i = mutatorsList.length - 1; i >= 0; i--) {
      mutator = mutatorsList[i](mutator);
    }
    let delta = mutator(doc);
    delta = DotMap.join(delta, clearDelta);

    if (context.delta === undefined) {
      context.delta = delta;
    } else {
      context.delta = DotMap.join(context.delta, delta);
    }
    
    context.doc = DotMap.join(doc, delta);
    return true;
  },

  deleteProperty(target, key) {
    const { context, wrappedObject, mutatorsList, isRoot } = target;

    let clearMutator = JsonMap.remove(key);
    let i;
    for (i = mutatorsList.length - 1; i >= 0; i--) {
      clearMutator = mutatorsList[i](clearMutator);
    }
    const doc = context.doc;
    let clearDelta = clearMutator(doc);

    if (context.delta === undefined) {
      context.delta = clearDelta;
    } else {
      context.delta = DotMap.join(context.delta, clearDelta);
    }
    context.doc = DotMap.join(doc, clearDelta);
    return true;
  },
};


const ListHandler = {
  get(target, prop) {
    let { context, wrappedObject, mutatorsList, isRoot } = target;
    if (prop === "sort") {
      const [_, cc] = context.doc;
      return function (customSort) {
        let orarray = [wrappedObject, cc]
        let length = ORArray.length(orarray)
        let indices = [...Array(length).keys()]
        let values = ORArray.value(orarray, false)
        let sortedIndices
        if (customSort === undefined) {
          sortedIndices = indices.sort((i,j) => values[i]-values[j])
        } else {
          sortedIndices = indices.sort((i,j) => customSort(values[i],values[j]))
        }

        for (let idx = length - 1; idx >= 0; idx--) {
          // mutatorsList.push(function (f) {
          //   return JsonArray.move(idx, indices[idx])
          // });
          let currIdx = sortedIndices[idx]
          let mutator = JsonArray.move(currIdx, 0)
          for (let i = mutatorsList.length - 1; i >= 0; i--) {
            mutator = mutatorsList[i](mutator);
          }
          for (let j = 0; j < sortedIndices.length; j++) {
            if (sortedIndices[j] < currIdx) {
              sortedIndices[j] = sortedIndices[j] + 1
            }          
          }
          const doc = context.doc;
          let delta = mutator(doc);
          if (context.delta === undefined) {
            context.delta = delta;
          } else {
            context.delta = DotMap.join(context.delta, delta);
          }
          context.doc = DotMap.join(doc, delta);
        }
      }
    }
    if (isRoot) {
      const [m, cc] = context.doc;
      wrappedObject = m;
      mutatorsList = new Array();
    }
    let [val, type] = ORArray.getIdx(wrappedObject, prop);
    if (type === MAP) {
      mutatorsList.push(function (f) {
        return JsonArray.applyToMap(f, prop);
      });
      return mapProxy(context, val, mutatorsList, false);
    } else if (type === ARRAY) {
      mutatorsList.push(function (f) {
        return JsonArray.applyToArray(f, prop);
      });
      return listProxy(context, val, mutatorsList, false);
    } else if (type === VALUE) {
      mutatorsList.push(function (f) {
        return JsonArray.applyToValue(f, prop);
      });
      return MVRProxy(context, val, mutatorsList);
    } else {
      throw new Error("Type not specified");
    }
  },
  set(target, prop, value) {
    const { context, wrappedObject, mutatorsList, isRoot } = target;
    let [mutator, type] = Peeler.genNestedObjectCreation(value);
    let insertFunc;
    let applyFunc;
    if (type === "map") {
      insertFunc = JsonArray.insertMap;
      applyFunc = JsonArray.applyToMap;
    } else if (type === "array") {
      insertFunc = JsonArray.insertArray;
      applyFunc = JsonArray.applyToArray;
    } else {
      insertFunc = JsonArray.insertValue;
      applyFunc = JsonArray.applyToValue;
    }

    if (prop == target.wrappedObject.state.size - 1) {
      // Take into account Alive key
      // This is a new idx. Add it
      mutatorsList.push(function (f) {
        return insertFunc(f, prop);
      });
    } else {
      // This is an updating index. Update it
      mutatorsList.push(function (f) {
        return applyFunc(f, prop);
      });
    }

    for (let i = mutatorsList.length - 1; i >= 0; i--) {
      mutator = mutatorsList[i](mutator);
    }
    const doc = context.doc;
    let delta = mutator(doc);
    context.delta = delta;
    context.doc = DotMap.join(doc, delta);
    return true;
  },

  deleteProperty(target, idx) {
    const { context, wrappedObject, mutatorsList, isRoot } = target;

    let clearMutator = JsonArray.delete(idx);
    let i;
    for (i = mutatorsList.length - 1; i >= 0; i--) {
      clearMutator = mutatorsList[i](clearMutator);
    }
    const doc = context.doc;
    let clearDelta = clearMutator(doc);

    context.delta = clearDelta;
    context.doc = DotMap.join(doc, clearDelta);
    return true;
  },
};

function basicProxyMatcher(m, c, type) {
  if (type === MAP) {
    return new Proxy({ m, c }, BasicMapHandler);
  } else if (type === ARRAY) {
    return new Proxy({ m, c }, BasicArrayHandler);
  } else if (type === VALUE) {
    return MVReg.value([m, c]);
  } else {
    throw new Error("Type not specified");
  }
}

const FrontendHandler = {
  get(target, key) {
    if (key === "object_bypass") {
      return target;
    }
    if (typeof key === "symbol") {
      return target[key];
    } else {
      let [m, c] = target[BACKEND].getState();
      let proxyToBackend = new Proxy({ m, c }, BasicMapHandler);
      // Let the proxy do the logic of lookup
      return proxyToBackend[key];
    }
  },
};

const BasicMapHandler = {
  get(target, key) {
    const { m, c } = target;
    let [val, type] = ORMap.getKey(m, key);
    return basicProxyMatcher(val, c, type);
  },
};

const BasicArrayHandler = {
  get(target, prop) {
    const { m, c } = target;
    let [val, type] = ORArray.getIdx(m, prop);
    return basicProxyMatcher(val, c, type);
  },
};

/**
 * @param context: a reference to doc (which is [m, cc] of the top level)
 * @param wrappedObject: The object actually wrapped by the proxy (the actual map)
 * @param mutatorsList: list of delta operations from top to current level
 * @param isRoot: boolean, determine if this proxy is the root proxy
 * @returns {{mutatorsList: *, context: *, wrappedObject: *}}
 */
function mapProxy(context, wrappedObject, mutatorsList, isRoot) {
  return new Proxy(
    { context, wrappedObject, mutatorsList, isRoot },
    MapHandler
  );
}

/**
 * @param context: a reference to doc (which is [m, cc] of the top level)
 * @param wrappedObject: The object actually wrapped by the proxy (the actual map)
 * @param mutatorsList: list of delta operations from top to current level
 * @param isRoot: boolean, determine if this proxy is the root proxy
 * @returns {{mutatorsList: *, context: *, wrappedObject: *}}
 */
function listProxy(context, wrappedObject, mutatorsList, isRoot) {
  return new Proxy(
    { context, wrappedObject, mutatorsList, isRoot },
    ListHandler
  );
}

function MVRProxy(context, wrappedObject, mutatorsList) {
  return new Proxy({ context, wrappedObject, mutatorsList }, MVRHandler);
}

/**
 * @param context: a reference to [m, cc]
 * @returns {{mutatorsList: *, context: *, wrappedObject: *}}
 */
function createRootObjectProxy(context) {
  const mutatorList = new Array();
  let [m, cc] = context.doc;
  return mapProxy(context, m, mutatorList, true);
}

module.exports = { createRootObjectProxy, FrontendHandler };
