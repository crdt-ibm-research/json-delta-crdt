'use strict'

// Properties of the document root object
const ALIVE = Symbol("_alive")   // property containing info whether a key is alive
const MAP = Symbol("_m")         // property containing info if the key points to a map
const ARRAY = Symbol("_a")       // property containing info if the key points to an array
const VALUE = Symbol("_v")       // property containing info if the key points to a value

module.exports = {
    ALIVE,
    MAP,
    ARRAY,
    VALUE
}