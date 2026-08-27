import * as fs from 'fs'
import * as zlib from 'node:zlib'
import path from 'path'

const builtChunkPath = `${process.cwd()}/dist/shared-worker-string/sharedWorker.iife.js`
const toInlinePath = `${import.meta.dirname}/generated/shared-worker-inline.ts`
const templatePath = `${import.meta.dirname}/util/shared-worker-inline-template.ts`

const template = fs.readFileSync(templatePath, 'utf-8')
const str = fs.readFileSync(builtChunkPath, 'utf-8')

const compressed = zlib.gzipSync(str)
// const compressed = zlib.brotliCompressSync(str)
const b64string = compressed.toString('base64')
console.log(`Compressed script's size in bytes =, ${compressed.length}`)
console.log(`inlined Base64 string's size in bytes =', ${b64string.length}`)

const stringToInline = template.replace(`<shared-worker-base64>`, b64string)

fs.mkdirSync(path.dirname(toInlinePath), { recursive: true })
fs.writeFileSync(toInlinePath, stringToInline, {})
