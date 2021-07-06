const { DotMap } = require("../backend/dotstores");
const { ORMap, ORArray } = require("../backend/crdts");
const JsonArray = require("../../src/backend/JsonObjects/JsonArray");
const JsonMap = require("../../src/backend/JsonObjects/JsonMap");
const JsonRegister = require("../../src/backend/JsonObjects/JsonRegister");

const CausalContext = require("../../src/backend/causal-context");

class Peeler {
  /**
   * Recursively creates DCRDT versions of all the objects and nested
   * objects in `value`, and returns the object ID of the root object. If any
   * object is an existing DCRDT object, its existing ID is returned.
   */
  static genNestedObjectCreation(value) {
    if (Array.isArray(value)) {
      let f = function ([m, cc]) {
        // Create a new array object
        let newCC = CausalContext.from(cc);
        let deltaArray = ORArray.create([null, newCC]);
        let darray = [new DotMap(ORArray.typename()), newCC];
        let orarray = [new DotMap(ORArray.typename()), newCC];
        orarray = DotMap.join(orarray, deltaArray);
        darray = DotMap.join(darray, deltaArray);
        let i;
        for (i = 0; i < value.length; i++) {
          const [currFunc, currType] = Peeler.genNestedObjectCreation(value[i]);
          let deltaMutator, delta;
          if (currType === "primitive") {
            deltaMutator = JsonArray.insertValue(currFunc, i);
          } else if (currType === "map") {
            deltaMutator = JsonArray.insertMap(currFunc, i);
          } else if (currType === "array") {
            deltaMutator = JsonArray.insertArray(currFunc, i);
          }
          delta = deltaMutator(orarray);
          orarray = DotMap.join(orarray, delta);
          darray = DotMap.join(darray, delta);
        }
        return darray;
      };
      return [f, "array"];
    } else if (isObject(value)) {
      let f = function ([m, cc]) {
        // Create a new map object
        let newCC = CausalContext.from(cc);
        let ormap = [new DotMap(ORMap.typename()), newCC];
        let dMap = [
          new DotMap(ORMap.typename()),
          new CausalContext(cc.getID()),
        ];
        let deltaMap = ORMap.create([null, newCC]);
        ormap = DotMap.join(ormap, deltaMap); // State for applying changes
        dMap = DotMap.join(dMap, deltaMap); // Accumulate the joins
        for (let key of Object.keys(value)) {
          const [currFunc, currType] = Peeler.genNestedObjectCreation(
            value[key]
          );
          let deltaMutator, delta;
          if (currType === "primitive") {
            deltaMutator = JsonMap.applyToValue(currFunc, key);
          } else if (currType === "map") {
            deltaMutator = JsonMap.applyToMap(currFunc, key);
          } else if (currType === "array") {
            deltaMutator = JsonMap.applyToArray(currFunc, key);
          }
          delta = deltaMutator(ormap);
          ormap = DotMap.join(ormap, delta);
          dMap = DotMap.join(dMap, delta);
        }
        return dMap;
      };
      return [f, "map"];
    } else {
      return [JsonRegister.write(value), "primitive"];
    }
  }
}

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

module.exports = Peeler;
