const { runTest } = require('runBenchmark')

function test(lib, doc1, n) {
    doc1 = lib.change(doc1, "test", doc => {
        doc.a = [ -1 ]
    })
    for (i=0; i<n; i++) {
        doc1 = lib.change(doc1, "test", doc => {
            doc.a[0] = i
        })
    }

    return doc1 
}

function jysTest(doc1, n) {
    const yarray = doc1.getArray('a')
    yarray.insert(0, [-1])
    for (i=0; i<n; i++) {
        yarray.delete(0,1)
        yarray.insert(0, [i])
    }
    return doc1
}

runTest(test, jysTest)