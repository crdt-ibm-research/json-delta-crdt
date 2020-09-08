/* eslint-env mocha */
'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const transmit = require('../../../src/helpers/transmit')
const MVReg = require('../../../src/backend/crdts/mvreg')
const DotFun = require('../../../src/backend/dotstores/dot-fun')
const CausalContext = require('../../../src/backend/causal-context')

describe('mvreg', () => {
  describe('local', () => {
    it('can write value', () => {
      const mvreg = [new DotFun('mvreg'), new CausalContext()] 
      const delta = MVReg.write('a', [mvreg[0], mvreg[1]])
      const res = DotFun.join(mvreg, delta)
      expect(MVReg.value(res)).to.equal(['a'])
    })

    // it('and the value is inserted', () => {
    //   expect(MVReg.value(mvreg)).to.equal('b')
    // })
  })

  // describe('together', () => {
  //   let replica1, replica2
  //   let deltas = [[], []]
  //   before(() => {
  //     replica1 = new MVReg('id1')
  //     replica2 = new MVReg('id2')
  //   })

  //   it('values can be written concurrently', () => {
  //     deltas[0].push(replica1.write('hello'))
  //     deltas[0].push(replica1.write('world'))
  //     deltas[1].push(replica2.write('world'))
  //     deltas[1].push(replica2.write('hello'))
  //   })

  //   it('has local values', () => {
  //     expect(Array.from(replica1.value()).sort()).to.deep.equal(['world'])
  //     expect(Array.from(replica2.value()).sort()).to.deep.equal(['hello'])
  //   })

  //   it('changes can be raw joined', () => {
  //     const state = new MVReg('joiner').join(transmit(replica1.state()), transmit(replica2.state()))
  //     const replica = new MVReg('replica')
  //     replica.apply(state)
  //     expect(Array.from(replica.value()).sort()).to.deep.equal(['hello', 'world'])
  //   })

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
