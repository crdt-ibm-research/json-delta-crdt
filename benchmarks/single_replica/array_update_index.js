const { runTest } = require('../runBenchmark')

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
    tmp = {}
    base = tmp
    for (i=0; i<n; i++) {
        tmp.a = {}
        tmp = tmp.a
    }
    tmp.a = 0
    doc1.getMap('a')['0'] = base
    return doc1
}

runTest(test, jysTest)