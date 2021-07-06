const msgpack = require("msgpack5")();
const { BACKEND, REPLICA_ID } = require("../../src/frontend/constants");
const DCRDT = require("../../src/frontend/index");

const CustomSet = require("../../src/backend/utils/custom-set");
const CausalContext = require("../../src/backend/causal-context");
const { DotMap, DotFun, DotFunMap } = require("../backend/dotstores");

msgpack.register(0x40, Map, encodeMap, decodeMap);
msgpack.register(0x41, Set, encodeSet, decodeSet);

msgpack.register(0x42, CausalContext, encodeCausalContext, decodeCausalContext);
msgpack.register(0x43, CustomSet, encodeCustomSet, decodeCustomSet);
msgpack.register(0x44, DotMap, encodeDotMap, decodeDotMap);
msgpack.register(0x45, DotFun, encodeDotFun, decodeDotFun);
msgpack.register(0x46, DotFunMap, encodeDotFunMap, decodeDotFunMap);

function encodeDotFunMap(dotfunmap) {
  return msgpack.encode({
    typename: dotfunmap.typename,
    state: dotfunmap.state,
  });
}

function decodeDotFunMap(buf) {
  const obj = msgpack.decode(buf);
  return new DotFunMap(obj.typename, obj.state);
}

function encodeDotFun(dotfun) {
  return msgpack.encode({
    typename: dotfun.typename,
    state: dotfun.state,
  });
}

function decodeDotFun(buf) {
  const obj = msgpack.decode(buf);
  return new DotFun(obj.typename, obj.state);
}

function encodeDotMap(dotmap) {
  return msgpack.encode({
    typename: dotmap.typename,
    state: dotmap.state,
  });
}

function decodeDotMap(buf) {
  const obj = msgpack.decode(buf);
  return new DotMap(obj.typename, obj.state);
}

function encodeCausalContext(causalContext) {
  return msgpack.encode({
    cc: causalContext._cc,
    dc: causalContext._dc,
    id: causalContext._id,
  });
}

function decodeCausalContext(buf) {
  const obj = msgpack.decode(buf);
  return new CausalContext(obj.id, obj.cc, obj.dc);
}

function encodeCustomSet(set) {
  return msgpack.encode(Array.from(set._refs));
}

function decodeCustomSet(buf) {
  return new CustomSet(new Map(msgpack.decode(buf)));
}

function encodeMap(map) {
  return msgpack.encode(Array.from(map));
}

function decodeMap(buf) {
  return new Map(msgpack.decode(buf));
}

function encodeSet(set) {
  return msgpack.encode(Array.from(set));
}

function decodeSet(buf) {
  return new Set(msgpack.decode(buf));
}

function encodeFrontend(frontend) {
  // encode only replica_id and the backend
  return msgpack.encode({
    REPLICA_ID: frontend[REPLICA_ID],
    DOT_STORE: frontend[BACKEND]._state[0],
    CC: frontend[BACKEND]._state[1],
  });
}

function decodeFrontend(buf) {
  // decode the buffer
  const obj = msgpack.decode(buf);
  // create a front end
  return DCRDT.init(obj);
}

function encode(value) {
  return msgpack.encode(value);
}

function decode(value) {
  return msgpack.decode(value);
}

module.exports = { encodeFrontend, decodeFrontend, encode, decode };
