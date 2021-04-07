const { runTest } = require('../runBenchmark')

function test(lib, doc1, n) {
    tmp = []
    base = tmp
    for (i=0; i<n; i++) {
        tmp[0] = []
        tmp = tmp[0]
    }
    tmp[0] = 0
    doc1 = lib.change(doc1, "test", doc => {
        doc.a = { "a" : base}
    })
    return doc1
}

function jysTest(doc1, n) {
    tmp = []
    base = tmp
    for (i=0; i<n; i++) {
        tmp[0] = []
        tmp = tmp[0]
    }
    tmp[0] = 0
    doc1.getMap('a').set('a', base)
    return doc1
}

runTest(test, jysTest)