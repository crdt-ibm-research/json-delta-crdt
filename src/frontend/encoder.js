const msgpack = require('msgpack5')()

msgpack.register(0x40, Map, encodeMap, decodeMap)

function encodeMap (map) {
    return msgpack.encode(Array.from(map))
}
  
function decodeMap (buf) {
    return new Map(msgpack.decode(buf))
}

module.exports = { encodeMap, decodeMap }