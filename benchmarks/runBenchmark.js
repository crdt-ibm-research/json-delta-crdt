const util = require("util");
const chai = require("chai");
const dirtyChai = require("dirty-chai");
chai.use(dirtyChai);

const Automerge = require("automerge");
const Y = require("yjs");

const DCRDT = require("../src/frontend/index");
const Encoder = require("../src/frontend/encoder");

let docDelta = DCRDT.init({ REPLICA_ID: "R1" });

let docAutomerge = Automerge.init();

let docYjs = new Y.Doc();

let docDeltaInspection, docAutomergeInspection, docYjsInspection;

function runTest(
  test,
  yjsTest,
  sizes = [
    1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
    65536, 131072, 262144, 524288,
  ],
  log = false
) {
  sizes.forEach((n) => {
    docDelta = DCRDT.init({ REPLICA_ID: "R1" });
    docDelta = test(DCRDT, docDelta, n);
    if (log) {
      console.log("DCRDT");
      console.log(DCRDT.documentValue(docDelta));
    }
    const encoded = Encoder.encodeFrontend(docDelta);
    docDeltaInspection = encoded.byteLength;

    docAutomerge = Automerge.init();
    docAutomerge = test(Automerge, docAutomerge, n);
    if (log) {
      console.log("Automerge");
      console.log(
        util.inspect(docAutomerge, { showHidden: false, depth: null })
      );
    }
    docAutomergeInspection = Automerge.save(docAutomerge).length;

    docYjs = new Y.Doc();
    docYjs = yjsTest(docYjs, n);
    if (log) {
      console.log("yjs");
      console.log(
        util.inspect(docYjs.toJSON(), { showHidden: false, depth: null })
      );
    }
    docYjsInspection = Y.encodeStateAsUpdateV2(docYjs).byteLength;

    console.log(
      `${n},${docDeltaInspection},${docAutomergeInspection},${docYjsInspection}`
    );
  });
}

module.exports = { runTest };
