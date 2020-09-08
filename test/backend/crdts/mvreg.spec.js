/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const MVReg = require('../../../src/backend/crdts/mvreg')
const DotFun = require('../../../src/backend/dotstores/dot-fun')
const CausalContext = require('../../../src/backend/causal-context')

describe('mvreg', () => {
  describe('local', () => {
    it('can write value', () => {
      const mvreg = [new DotFun('mvreg'), new CausalContext()] 
      const delta = MVReg.write('a', [mvreg[0], mvreg[1]])
      const res = DotFun.join(mvreg, delta)
      expect(MVReg.value(res)).to.deep.equal(new Set(['a']))
    })

    it('can write multiple values and keep the last - join order 1', () => {
      const mvreg = [new DotFun('mvreg'), new CausalContext()] 
      const delta_a = MVReg.write('a', [mvreg[0], mvreg[1]])
      const after_delta = DotFun.join(mvreg, delta_a)
      const delta_b = MVReg.write('b', [after_delta[0], after_delta[1]])
      const res = DotFun.join(after_delta, delta_b)
      expect(MVReg.value(res)).to.deep.equal(new Set(['b']))
    })

    it('can write multiple values and keep the last - join order 2', () => {
      const mvreg = [new DotFun('mvreg'), new CausalContext()] 
      const delta_a = MVReg.write('a', [mvreg[0], mvreg[1]])
      const delta_b = MVReg.write('b', [delta_a[0], delta_a[1]])
      const res = DotFun.join(mvreg, delta_b)
      expect(MVReg.value(res)).to.deep.equal(new Set(['b']))
    })
  })

  describe('two replicas', () => {
    let replica1, replica2
    let deltas = [[], []]

    before(() => {
      replica1 = [new DotFun('mvreg'), new CausalContext()]
      replica2 = [new DotFun('mvreg'), new CausalContext()]
    })

    it('values can be written concurrently', () => {
      deltas[0].push(MVReg.write('a', [replica1[0], replica1[1]]))
      deltas[0].push(MVReg.write('b', [deltas[0][0], deltas[0][1]]))
      replica1 = DotFun.join(mvreg, deltas[0].reduce(DotFun.join))
      
      deltas[1].push(MVReg.write('b', [replica1[0], replica1[1]]))
      deltas[1].push(MVReg.write('a', [deltas[0][0], deltas[0][1]]))
      replica2 = DotFun.join(mvreg, deltas[1].reduce(DotFun.join))
    })

    it('has local values', () => {
      expect(MVReg.value(replica1)).to.deep.equal(new Set(['b']))
      expect(MVReg.value(replica1)).to.deep.equal(new Set(['a']))
    })

    it('changes can be raw joined', () => {
      const join = DotFun.join(replica1, replica2)
      expect(Array.from(MVReg.value(join)).sort()).to.deep.equal(['a', 'b'])
    })
  })

  //   it('changes from one can be joined to the other', () => {
  //     deltas[0].forEach((delta) => replica2.apply(transmit(delta)))
  //   })

  //   it('and vice versa', () => {
  //     deltas[1].forEach((delta) => replica1.apply(transmit(delta)))
  //   })

  //   it('the first converges', () => {
  //     expect(Array.from(replica1.value()).sort()).to.deep.equal(['hello', 'world'])
  //   })

  //   it('and the second also converges', () => {
  //     expect(Array.from(replica2.value()).sort()).to.deep.equal(['hello', 'world'])
  //   })

  //   it('binary ids also converge', () => {
  //     const replicaA = MVReg(Buffer.from('idA'))
  //     const deltaA = replicaA.write('a')
  //     const replicaB = MVReg(Buffer.from('idB'))
  //     replicaB.apply(deltaA)
  //     const deltaB = replicaB.write('b')
  //     replicaA.apply(deltaB)
  //     expect(Array.from(replicaA.value()).sort()).to.deep.equal(['b'])
  //   })
  // })
})
