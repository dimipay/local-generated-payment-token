const crypto = require('node:crypto')

/** Encryption Configs */

const HMAC_ALGORITHM = 'sha1'
const HMAC_LENGTH = 16
const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC403bmYfWed2oVxZOeUQ2V/ieN
nXhuc5XMwZNOqngHKJ/lM+hFy66k0I5rCaWyCTwanEnX3hpXL7JYI/st8ndpwjp2
Nn5pP9QtRdeEI7AvXdn1Ew5NP0QQqQDC7Pp0fBgq1f0xAr7sy5NDZuM0E/i9Lmgh
MjyYEPJlBcg0KU6C+QIDAQAB
-----END PUBLIC KEY-----`

/** Client Information */

const methodRegisteredAt = 1694031673030
const paymentCodeDuration = 60_000 // 1분
const methodId = '7f812d77-4065-4499-99cb-5ca1fe4ebba4' // UUID v4
const methodSecretKey = 'fa98ac8c0a694d5e81401036b8ab88f1'

/** Encryption */

const currentTime = new Date().getTime()

// count 계산
const count = Math.floor((currentTime - methodRegisteredAt) / paymentCodeDuration)

// HMAC 계산
const hmacValue = crypto
  .createHmac(HMAC_ALGORITHM, methodSecretKey)
  .update(count.toString())
  .digest('hex')
  .slice(0, HMAC_LENGTH)

// UUID에서 hyphen 제거
const hexMethodId = methodId.replace(/-/g, '')

const payload = hexMethodId + hmacValue

console.log('payload: ', payload)

// payload 암호화
const encrypted = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  },
  Buffer.from(payload),
)

console.log(encrypted.toString('base64'))
