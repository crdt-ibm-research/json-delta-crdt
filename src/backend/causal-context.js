'use strict'

const CustomSet = require('./custom-set')
const uuid = require('./uuid')
const { assert } = require('chai');

// Autonomous causal context, for context sharing in maps
// Methods of CausalContext mutate its own state
class CausalContext {
  // The id is used for creating new dots.
  // replicas have a CausalContext with id.
  // delta do not have an id as it is doesn't create dots.
  constructor(id) {
    this._cc = new Map() // compact causal context {ID->INT}
    this._dc = new CustomSet() // dot cloud SET([id,int], ...)
    this._id = id
  }

  static from(other) {
    if (!(other instanceof CausalContext)) {
      throw new Error('expected CausalContext')
    }
    const result = new CausalContext(other._id)
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

  getID() {
    return this._id
  }

  next() {
    assert(this._id !== undefined, "id is undefined, deltas cc cannot be used to create dots")
    const value = this._cc.get(this._id) || 0
    const newValue = value + 1
    return [this._id, newValue]
  }

  makeDot() {
    assert(this._id !== undefined, "id is undefined, deltas cc cannot be used to create dots")
    // On a valid dot generator, all dots should be compact on the used id
    // Making the new dot, updates the dot generator and returns the dot
    const n = this.next(this._id)
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
    assert(other instanceof CausalContext, "join should receive a causal context")
    if (this === other) return this // Join is idempotent, but just dont do it.

    // preserve the id when joining with a replica
    this._id = this._id || other._id

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
