const msgpack = require('msgpack5')()
const DCRDT = require('../../src/frontend/index')
const { BACKEND, REPLICA_ID } = require('../../src/frontend/constants')

function encodeFrontend (frontend) {
    // encode only replica_id and the backend
    return msgpack.encode({
        REPLICA_ID: frontend[REPLICA_ID],
        DOT_STORE: frontend[BACKEND].dotstore } )
}
  
function decodeFrontend (buf) {
    // decode the buffer
    const obj = msgpack.decode(buf);
    // create a front end
    return DCRDT.init(obj)
}

module.exports = { encodeFrontend, decodeFrontend }