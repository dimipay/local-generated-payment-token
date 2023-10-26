const crypto = require('node:crypto')

/** Encryption Configs */

const paymentCodeDuration = 60_000 // 1분
const HMAC_LENGTH = 16
const HMAC_ALGORITHM = 'sha1'
const privateKey = `-----BEGIN PRIVATE KEY-----
MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBALjTduZh9Z53ahXF
k55RDZX+J42deG5zlczBk06qeAcon+Uz6EXLrqTQjmsJpbIJPBqcSdfeGlcvslgj
+y3yd2nCOnY2fmk/1C1F14QjsC9d2fUTDk0/RBCpAMLs+nR8GCrV/TECvuzLk0Nm
4zQT+L0uaCEyPJgQ8mUFyDQpToL5AgMBAAECgYBpHoxvd6OU32IMw/SzhHHvrz+b
wcYvO7olXKuFgFsH50kZuS4QFEpeHugBZNlCqxHuKJmvFvlwQQZ0LvK7LT5Qhdms
xi3envdmY0kscH1VtiO80y80k0VvKU0hMAF6NR/L+ltLE6INSDXisiPANHSBXtuI
4aOHvMKkcXrB5UvioQJBAO5YaYy9ApDimYrtWUZpiU/rtbnB9GBGmB1pm0fWibo0
FF7IBEaPCxzLZVStS2tUSbLDXzi8xI29km1ayKBiqhUCQQDGhDM1KK1ur5tgXoco
3gv3XbIYELFenMB9cLRA/9u2UzubaEptHTxBw00Ef7Xqh5e8qgU7eJdxRzF70hGh
sGJVAkEAg7iy5IfUsjO5PZE8pHBQ5a1TqkxpfQemq6KgoYwMY67CjzslOcV2E7zI
zIpVQwS7EiNtLZMNYXQiR3NDq3e7nQJAE1sUexxqPJ6WscDFwPBVjlruYHZQNP9n
rVNt3+CSlaZr620xxI3TMD5Qph2lqSZrXxPcyr2pVnwwkPgci/1cuQJAH74OTSQu
aAe3z1tzP5t/MVwQXHYxkQtg+4TlTpt+6QhQ4OeYl6pliTxi43fYFeiaYoD4JN/D
V/SWPQ/ErZdfYg==
-----END PRIVATE KEY-----`


/** Client Information */

const methodRegisteredAt = 1694031673030
const methodSecretKey = 'fa98ac8c0a694d5e81401036b8ab88f1'

const paymentCode = process.argv[2]

const decrypted = crypto.privateDecrypt(
  {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  },
  Buffer.from(paymentCode, 'base64')
)

const hexMethodId = decrypted.toString('utf-8', 0, 32)
const hmacValue = decrypted.toString('utf-8', 32, 32 + HMAC_LENGTH)

// verify mhac
const currentTime = new Date().getTime()
const count = Math.floor((currentTime - methodRegisteredAt) / paymentCodeDuration)
const expectedHmacValue = crypto
.createHmac(HMAC_ALGORITHM, methodSecretKey)
.update(count.toString())
.digest('hex')
.slice(0, HMAC_LENGTH)

if (hmacValue !== expectedHmacValue) {
  console.log('Invalid payment code')
  process.exit(1)
}

console.log('Valid payment code')
console.log('methodId:', hexMethodId)