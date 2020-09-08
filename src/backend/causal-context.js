'use strict'

const CustomSet = require('./custom-set')
const uuid = require('./uuid')

// Autonomous causal context, for context sharing in maps
// Methods of CausalContext mutate its own state
class CausalContext {
  constructor(id) {
    this._cc = new Map() // compact causal context {ID->INT}
    this._dc = new CustomSet() // dot cloud SET([id,int], ...)
    this._id = id || uuid()
  }

  static from(other) {
    if (!(other instanceof CausalContext)) {
      throw new Error('expected CausalContext')
    }
    const result = new CausalContext()
    result._cc = new Map([...other._cc])
    result._dc = CustomSet.from(other._dc)
    return result
  }

  dotIn(dot) {
    const [key, value] = dot
    const count = this._cc.get(key)
    return (value <= count || this._dc.has(dot))
  }

  compact() {
    let flag = true
    while (flag) {
      flag = false
      for (let dot of this._dc.values()) {
        const [key, value] = dot
        const existing = this._cc.get(key)
        if (!existing) {
          if (value === 1) {
            // Can compact
            this._cc.set(key, value)
            // TODO: is deletion safe during iteration?
            this._dc.delete(dot)
            flag = true
          }
        } else {
          if (value === existing + 1) {
            // Contiguous, can compact
            this._cc.set(key, value)
            this._dc.delete(dot)
            flag = true
          } else {
            if (value <= existing) {
              // dominated, so prune
              this._dc.delete(dot)
              // no extra compaction oportunities so flag untouched
            }
          }
        }
      }
    }
    return this
  }

  _next() {
    const value = this._cc.get(this._id) || 0
    const newValue = value + 1
    return [this._id, newValue]
  }

  makeDot() {
    // On a valid dot generator, all dots should be compact on the used id
    // Making the new dot, updates the dot generator and returns the dot
    const n = this._next(this._id)
    this._cc.set(n[0], n[1])
    return n
  }

  insertDot(dot, compactNow) {
    this._dc.add(dot)
    if (compactNow) {
      this.compact()
    }
    return this
  }

  insertDots(dots) {
    for (let dot of dots) {
      this.insertDot(dot)
    }
    return this.compact()
  }

  join(other) {
    if (this === other) return this // Join is idempotent, but just dont do it.

    if (!(other instanceof CausalContext)) {
      other = CausalContext.from(other)
    }

    const allKeys = new Set([...this._cc.keys(), ...other._cc.keys()])
    for (let key of allKeys) {
      this._cc.set(key, Math.max(this._cc.get(key) || 0, other._cc.get(key) || 0))
    }
    for (let dot of other._dc.values()) {
      this.insertDot(dot)
    }
    return this.compact()
  }
}

module.exports = CausalContext
