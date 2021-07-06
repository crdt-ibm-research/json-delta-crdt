'use strict'

const { MVReg } = require("../crdts")

class JsonRegister {

    static values(state) {
        return MVReg.values(state)
    }
    
    static value(state) {
        return MVReg.value(state)
    }

    static write(v) {
        return function([m,cc]) {return MVReg.write(v, [m,cc])}
    }
    
    static clear() {
        return function([m,cc]) { return MVReg.clear([m,cc])}
    }
}

module.exports = JsonRegister