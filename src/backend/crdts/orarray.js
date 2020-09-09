'use strict'

const { assert } = require('chai')

const DotMap = require('../dotstores/dot-map')
const CausalContext = require('../causal-context')
const MVReg = require('./mvreg')
const { ALIVE, MAP, ARRAY, VALUE } = require('../constants')

class ORArray {
    static typename() {
        return "or-array"
    }

    static value(pos, [m, cc]) {
        assert(m instanceof ORArray)
    }

    static create([m,cc]) {
        
    }

    static insert(uid, o, p, [m,cc]) {

    }

    static apply(uid, o, p, [m,cc]) {

    }

    static move(uid, p, [m,cc]) {

    }

    static delete(uid, [m,cc]) {

    }

    static clear([m,cc]) {        

    }
}

module.exports = ORMap