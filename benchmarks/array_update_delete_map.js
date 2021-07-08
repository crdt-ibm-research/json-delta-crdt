/* 
  Consecutively inserting and deleting a map in an array.
  Creates Figure 13.
*/

const Y = require("yjs");
const { runTest } = require("./runBenchmark");

function test(lib, doc1, n) {
  doc1 = lib.change(doc1, "test", (doc) => {
    doc.a = [-1];
  });
  for (i = 0; i < n; i++) {
    doc1 = lib.change(doc1, "test", (doc) => {
      doc.a[0] = { "a" : 1 };
    });
    doc1 = lib.change(doc1, "test", (doc) => {
      delete doc.a[0];
    });
  }

  return doc1;
}

function yjsTest(doc1, n) {
  const yarray = doc1.getArray("a");
  yarray.insert(0, [-1]);
  for (i = 0; i < n; i++) {
    yarray.delete(0, 1);
    let ymap = new Y.Map();
    ymap.set("a", 1);
    yarray.insert(0, [ymap]);
  }
  return doc1;
}

runTest(test, yjsTest);
