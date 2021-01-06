const BACKEND = Symbol("_backend")
const DELTAS = Symbol("_deltas")
const DELTAS_CACHE_MODE = Symbol("_deltas_cache_mode")
const COMPRESSED_DELTAS = Symbol("_compressed_deltas")
const UNCOMPRESSED_DELTAS = Symbol("_uncompressed_deltas")

module.exports = { BACKEND, DELTAS, DELTAS_CACHE_MODE, COMPRESSED_DELTAS, UNCOMPRESSED_DELTAS }