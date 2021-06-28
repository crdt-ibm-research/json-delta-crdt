const { runTest } = require('./runBenchmark')
const Y = require('yjs')

function test(lib, doc1, n) {
    doc1 = lib.change(doc1, "test", doc => {
        doc.a = []
    })
    for (i = 0; i < n; i++) {
        doc1 = lib.change(doc1, "test", doc => {
            doc.a[0] = { "a": i }
        })
        doc1 = lib.change(doc1, "test", doc => {
            delete doc.a[0]
        })
    }

    return doc1
}

function jysTest(doc1, n) {
    const yarray = doc1.getArray('a')
        // yarray.insert(0, [-1])
    for (i = 0; i < n; i++) {
        let m = new Y.Map()
        m.set("a", i)
        yarray.insert(0, [m])
            // yarray.insert(0, [i])
        yarray.delete(0, 1)
    }
    return doc1
}

runTest(test, jysTest)