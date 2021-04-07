const { runTest } = require('../runBenchmark')

function test(lib, doc1, n) {
    doc1 = lib.change(doc1, "test" + n, doc => {
        doc.a = []
    })
    for (i=0; i<n; i++) {
        doc1 = lib.change(doc1, "test" + n + i, doc => {
            doc.a[i] = i
        })
    }
    return doc1 
}

function jysTest(doc1, n) {
    const yarray = doc1.getArray('a')
    for (i=0; i<n; i++) {
        yarray.insert(i, [i])
    }
    return doc1
}

runTest(test, jysTest)