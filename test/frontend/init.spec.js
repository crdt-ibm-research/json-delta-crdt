const chai = require('chai')
const dirtyChai = require('dirty-chai')
const DCRDT = require('../../src/frontend/index')
const { Backend } = require('../../src/frontend/constants')
const expect = chai.expect
chai.use(dirtyChai)

describe('test frontend ', () => {
        describe('check frontend', () => {
            it('check empty nesting', () => {
                let doc = DCRDT.init({"REPLICA_ID": "R1"})
                doc = DCRDT.change(doc, "test", doc => {
                    doc.a = {"b": { "c": 7 }}
                    doc.a.b.c = 5
                    doc.a.b = {"hi": "bye"}
                })
                expect(DCRDT.documentValue(doc)).to.deep.equal(
                    {"a": {"b": {"hi": new Set(["bye"])} }}
                )

                expect(doc.a.b.hi).to.deep.equal("bye")
            })
        })
    }
)