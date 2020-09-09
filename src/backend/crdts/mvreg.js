'use strict'

const DotFun = require('../dotstores/dot-fun')
const CausalContext = require('../causal-context')

class MVReg {
  static typename() {
    return "mvreg"
  }

  static values([m, c]) {
    const ret = new Set()
    for (let [, value] of m.items()) {
      ret.add(value)
    }
    return ret
  }

  // returns the value of the MVReg solving conlicts according to:
  // dot is [String, Integer], so first largest Integer then largest String
  static value([m, c]) {
    const max_dot = [...m.dots()].reduce(function(prev, current) {
      if (prev[1] > current[1]) {
        return prev
      } else if (prev[1] == current[1]) {
        if (prev[0] > current[0]) {
          return prev
        } else {
          return current
        }
      } else {
        return current
      }
    }) 
    return m.get(max_dot)
  }

  static write(value, [m, c]) {
    // handle undefined
    m = m || new DotFun(MVReg.typename())
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