'use strict'

const DotFun = require('../dotstores/dot-fun')
const CausalContext = require('../causal-context')

class MVReg {
  static value([m, c]) {
    const ret = new Set()
    for (let [, value] of m.items()) {
      ret.add(value)
    }
    return ret
  }

  static write(value, [m, c]) {
    const dot = c.next()
    const newState = new DotFun(m.typename).set(dot, value)
    const newCC = new CausalContext().insertDot(dot).insertDots(m.dots())
    return [newState, newCC]
  }

  static clear([m, c]) {
    return [new DotFun(m.typename), new CausalContext().insertDots(m.dots())]
  }
}

module.exports = MVReg
