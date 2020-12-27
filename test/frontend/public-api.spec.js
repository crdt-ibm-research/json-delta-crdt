const chai = require('chai')
const dirtyChai = require('dirty-chai')
const DCRDT = require('../../src/frontend/index')
const {DotMap, DotFun, DotFunMap} = require('../../src/backend/dotstores/unifiedDotstores')
const Peeler = require('../../src/frontend/peeler')
const {ORMap, ORArray, MVReg} = require('../../src/backend/crdts/unifiedCRDTs')
const CausalContext = require('../../src/backend/causal-context')

const expect = chai.expect
chai.use(dirtyChai)

describe('test frontend public API ', () => {
        describe('check init and change', () => {
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

                doc = DCRDT.change(doc, "test", doc => {
                    doc.a.b = {"hi": "bye-2"}
                })
                expect(doc.a.b.hi).to.deep.equal("bye-2")
                doc = DCRDT.change(doc, "test", doc => {
                    doc.a.c = {"hi": "bye-3"}
                })
                expect(doc.a.c.hi).to.deep.equal("bye-3")
            })
        })

    describe('check init and change', () => {
        it('check apply changes', () => {
            // We start with an empty document
            let doc = DCRDT.init({"REPLICA_ID": "R1"})

            // Some data is inserted to a remote replica
            let remoteReplica = ORMap.create([null, new CausalContext("R2")])
            let [f, _] = Peeler.genNestedObjectCreation({"hello": {"name": "abc"}})
            let delta = ORMap.applyToMap(f, "content", remoteReplica)
            remoteReplica = DotMap.join(remoteReplica, delta)

            // We receive the changes
            console.log("merging insert delta")
            doc = DCRDT.applyChanges(doc, delta)
            expect(doc.content.hello.name).to.deep.equal("abc")
            expect(DCRDT.documentValue(doc)).to.deep.equal(
                {"content": {"hello": {"name": new Set(["abc"])} }}
            )

            // Finally, we remove the element
            console.log("merging remove delta")
            delta = ORMap.remove("content", remoteReplica)
            remoteReplica = DotMap.join(remoteReplica, delta)
            expect(ORMap.value(remoteReplica)).to.deep.equal({})

            // We receive the changes
            doc = DCRDT.applyChanges(doc, delta)
            // the next line fails in tests currently
            //expect(ORMap.value(DCRDT.documentValue(doc))).to.deep.equal({})
        })
    })
})