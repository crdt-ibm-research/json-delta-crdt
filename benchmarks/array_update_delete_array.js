/* 
  Consecutively inserting and deleting an array in an array.
  Creates Figure 14.
*/

const Y = require("yjs");
const { runTest } = require("./runBenchmark");

function test(lib, doc1, n) {
  doc1 = lib.change(doc1, "test", (doc) => {
    doc.a = [-1];
  });
  for (i = 0; i < n; i++) {
    doc1 = lib.change(doc1, "test", (doc) => {
      doc.a[0] = [ 1 ];
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
    let arr = new Y.Array();
    arr.insert(0,[1])
    yarray.insert(0, [arr]);
  }
  return doc1;
}

let sizes = [1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384,32768]

runTest(test, yjsTest, sizes);
