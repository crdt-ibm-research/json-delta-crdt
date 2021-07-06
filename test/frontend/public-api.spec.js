const chai = require('chai')
const dirtyChai = require('dirty-chai')
const DCRDT = require('../../src/frontend/index')

const { COMPRESSED_DELTAS, UNCOMPRESSED_DELTAS } = require('../../src/frontend/constants')
const { DotMap } = require('../../src/backend/dotstores')
const Peeler = require('../../src/frontend/peeler')
const { ORMap } = require('../../src/backend/crdts')
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

    describe('check apply changes', () => {
        it('check apply changes', () => {
            // We start with an empty document
            let doc = DCRDT.init({"REPLICA_ID": "R1"})

            // Some data is inserted to a remote replica
            let remoteReplica = ORMap.create([null, new CausalContext("R2")])
            let [f, _] = Peeler.genNestedObjectCreation({"hello": {"name": {"key": "abc"}}})
            let delta = ORMap.applyToMap(f, "content", remoteReplica)
            remoteReplica = DotMap.join(remoteReplica, delta)

            // We receive the changes
            doc = DCRDT.applyChanges(doc, delta)
            expect(doc.content.hello.name.key).to.deep.equal("abc")
            expect(DCRDT.documentValue(doc)).to.deep.equal(
                {"content": {"hello": {"name": { "key": new Set(["abc"]) }}}}
            )

            // Finally, we remove the element
            delta = ORMap.remove("content", remoteReplica)
            remoteReplica = DotMap.join(remoteReplica, delta)
            expect(ORMap.value(remoteReplica)).to.deep.equal({})

            // We receive the changes
            doc = DCRDT.applyChanges(doc, delta)
            expect(DCRDT.documentValue(doc)).to.deep.equal({})
        })
    })

    describe('check getChanges', () => {
        it('check getChanges - compressed-changes', () => {
            let doc = DCRDT.init({"REPLICA_ID": "R1", "DELTAS_CACHE_MODE": COMPRESSED_DELTAS })
            doc = DCRDT.change(doc, "test", doc => {
                doc.a = {"b": { "c": 7 }}
                doc.a.b.c = 5
                doc.a.b = {"hi": "bye"}
            })
            expect(DCRDT.documentValue(doc)).to.deep.equal(
                {"a": {"b": {"hi": new Set(["bye"])} }}
            )

            let delta = DCRDT.getChanges(doc)
            let doc2 = DCRDT.init({"REPLICA_ID": "R2"})
            doc2 = DCRDT.applyChanges(doc2, delta)
            expect(DCRDT.documentValue(doc2)).to.deep.equal(
                {"a": {"b": {"hi": new Set(["bye"])} }}
            )

            // Do some changes in doc, and propagate them to doc2
            doc = DCRDT.change(doc, "test", doc => {
                doc.a.c = {"hi": "bye-2"}
            })

            doc = DCRDT.change(doc, "test", doc => {
                doc.a.c = {"hi": "bye-3"}
            })

            delta = DCRDT.getChanges(doc)
            doc2 = DCRDT.applyChanges(doc2, delta)
            expect(doc2.a.c.hi).to.deep.equal("bye-3")

            doc = DCRDT.change(doc, "test", doc => {
                doc.arr =  [0,1,2]
            })

            delta = DCRDT.getChanges(doc)
            doc2 = DCRDT.applyChanges(doc2, delta)
            // TODO: compare entire array at once
            expect(doc2.arr[0]).to.deep.equal(0)
            expect(doc2.arr[1]).to.deep.equal(1)
            expect(doc2.arr[2]).to.deep.equal(2)
        })

        it('check getChanges - uncompressed-changes', () => {
            let doc = DCRDT.init({"REPLICA_ID": "R1", "DELTAS_CACHE_MODE": UNCOMPRESSED_DELTAS })
            doc = DCRDT.change(doc, "test", doc => {
                doc.a = {"b": { "c": 7 }}
                doc.a.b.c = 5
                doc.a.b = {"hi": "bye"}
            })
            expect(DCRDT.documentValue(doc)).to.deep.equal(
                {"a": {"b": {"hi": new Set(["bye"])} }}
            )

            let delta = DCRDT.getChanges(doc)
            let doc2 = DCRDT.init({"REPLICA_ID": "R2"})
            doc2 = DCRDT.applyChanges(doc2, delta)
            expect(DCRDT.documentValue(doc2)).to.deep.equal(
                {"a": {"b": {"hi": new Set(["bye"])} }}
            )

            // Do some changes in doc, and propagate them to doc2
            doc = DCRDT.change(doc, "test", doc => {
                doc.a.c = {"hi": "bye-2"}
            })

            doc = DCRDT.change(doc, "test", doc => {
                doc.a.c = {"hi": "bye-3"}
            })

            delta = DCRDT.getChanges(doc)
            doc2 = DCRDT.applyChanges(doc2, delta)
            expect(doc2.a.c.hi).to.deep.equal("bye-3")

            doc = DCRDT.change(doc, "test", doc => {
                doc.arr =  [0,1,2]
            })

            delta = DCRDT.getChanges(doc)
            doc2 = DCRDT.applyChanges(doc2, delta)
            // TODO: Check how to compare entire array at once
            expect(doc2.arr[0]).to.deep.equal(0)
            expect(doc2.arr[1]).to.deep.equal(1)
            expect(doc2.arr[2]).to.deep.equal(2)
        })

        it('check overriding value', () => {
            let doc = DCRDT.init({"REPLICA_ID": "R1" })
            doc = DCRDT.change(doc, "test", doc => {
                doc.a = {"b": { "c": 7 }}
                doc.a.b.c = 5
    
            })
    
            doc = DCRDT.change(doc, "test", doc => {
                doc.a.b = {"hi": "bye"}
            })
    
            expect(DCRDT.documentValue(doc)).to.deep.equal(
            {
                "a": {
                    "b": { 
                        "hi": new Set(["bye"])
                    }
                }
            })
        })
    })

    describe('check from utility', () => {
        it('check from dictionary', () => {
            let doc = DCRDT.from({"a": { "b": "c" }}, {"REPLICA_ID": "R1"})
            expect(doc.a.b).to.deep.equal("c")
        })

        it('check from list', () => {
            // We start with an empty document
            let doc = DCRDT.from({"a": {"b": [1,2,3]}}, {"REPLICA_ID": "R1"})
            expect(DCRDT.documentValue(doc)).to.deep.equal({"a": {"b": [new Set([1]), new Set([2]), new Set([3])] }})
        })
    })
})