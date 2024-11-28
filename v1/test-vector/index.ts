import { base45 } from "@dimipay/bqencode"
import { HKDF } from '@stablelib/hkdf'
import { SHA384 } from "@stablelib/sha384"
import { XChaCha20Poly1305 } from "@stablelib/xchacha20poly1305"

enum Tag {
  AUTH_TYPE = 1,
  AUTH_TOKEN = 2,
  USER_IDENTIFIER = 3,
  DEVICE_IDENTIFIER = 4,
  PAYMENT_METHOD_INDEX = 5,
  NONCE = 6,
  PAYLOAD_LENGTH_IDENTIFIER = 7,
  ADDITIONAL_DATA = 8,
}

export enum AuthType {
  BYPASS = 0x01,
  LOCAL_AUTH = 0x10,
  PATTERN_AUTH = 0x01,
  BIO_AUTH = 0x18,
  FINGERPRINT_AUTH = 0x19,
  FACE_AUTH = 0x1a,
  IRIS_AUTH = 0x1b,
  ONLINE_AUTH = 0x20,
  ONLINE_PIN_AUTH = 0x21,
}

type BufferValueToString<T extends object> = {
  [K in keyof T]: T[K] extends Buffer ? string : T[K]
}

export class Params {
  readonly metadata: Buffer
  readonly applicationIdentifier: Buffer
  readonly version: Buffer

  readonly authType: AuthType
  readonly userIdentifier: Buffer
  readonly paymentMethodIdentifier: Buffer

  readonly authToken: Buffer
  readonly deviceIdentifier: Buffer
  readonly nonce: Buffer

  readonly t: number
  readonly t0: number
  readonly rootKey: Buffer

  constructor(params: Omit<BufferValueToString<Params>, 'metadata'>) {
    if (params.applicationIdentifier.length !== 8) {
      throw new Error("applicationIdentifier must be 4 bytes")
    }

    if (params.version.length !== 2) {
      throw new Error("version must be 1 byte")
    }

    if (!Object.values(AuthType).includes(params.authType)) {
      throw new Error("authType must be one of the following values: " + Object.values(AuthType).join(", "))
    }

    this.applicationIdentifier = Buffer.from(params.applicationIdentifier, 'hex')
    this.version = Buffer.from(params.version, 'hex')
    this.metadata = Buffer.concat([Buffer.from([0x4c, 0x50]), this.applicationIdentifier, this.version])

    this.authType = params.authType
    this.userIdentifier = Buffer.from(params.userIdentifier, 'hex')
    this.paymentMethodIdentifier = Buffer.from(params.paymentMethodIdentifier, 'hex')

    this.authToken = Buffer.from(params.authToken, 'hex')
    this.deviceIdentifier = Buffer.from(params.deviceIdentifier, 'hex')
    this.nonce = Buffer.from(params.nonce, 'hex')

    this.t = params.t
    this.t0 = params.t0
    this.rootKey = Buffer.from(params.rootKey, 'hex')
  }
}

export function createToken(params: Params) {
  // build common payload
  const authTypeTLV = tlv(Tag.AUTH_TYPE, Buffer.from([params.authType]))
  const userIdentifierTLV = tlv(Tag.USER_IDENTIFIER, params.userIdentifier)
  const paymentMethodIdentifierTLV = tlv(Tag.PAYMENT_METHOD_INDEX, params.paymentMethodIdentifier)
  const commonPayload = buildPayload([authTypeTLV, userIdentifierTLV, paymentMethodIdentifierTLV])

  // build private payload
  const authTokenTLV = tlv(Tag.AUTH_TOKEN, params.authToken)
  const deviceIdentifierTLV = tlv(Tag.DEVICE_IDENTIFIER, params.deviceIdentifier)
  const nonceTLV = tlv(Tag.NONCE, params.nonce)
  const privatePayload = buildPayload([authTokenTLV, deviceIdentifierTLV, nonceTLV])

  // encrypt private payload
  const c = computeCounter(params.t, params.t0)
  const info = Buffer.from(`local-generated-payment-token${c}`)
  const hkdf = new HKDF(SHA384, params.rootKey, params.userIdentifier, info)

  const tmp = Buffer.from(hkdf.expand(56))
  const k = tmp.subarray(0, 32)
  const n = tmp.subarray(32)

  const xchachapoly1305 = new XChaCha20Poly1305(k)
  const aad = Buffer.concat([params.metadata, commonPayload])
  const encryptedPrivatePayload = Buffer.from(xchachapoly1305.seal(n, privatePayload, aad))

  // final
  const final = Buffer.concat([params.metadata, commonPayload, encryptedPrivatePayload])
  const encoded = base45.encode(final)

  return encoded
}

function buildPayload(tlvs: Buffer[]): Buffer {
  const payloadLength = tlvs.reduce((acc, tlv) => acc + tlv.length, 0)
  const payloadLengthIndicatorTLV = tlv(Tag.PAYLOAD_LENGTH_IDENTIFIER, Buffer.from([payloadLength]))

  return Buffer.concat([payloadLengthIndicatorTLV, ...tlvs])
}

function computeCounter(t: number, t0: number): number {
  return Math.floor((t - t0) / 30_000)
}

function tlv(tag: Tag, value: Buffer) {
  const length = Math.log2(value.length)
  if (!Number.isInteger(length) || length < 0 || length > 5) {
    throw new Error("value length is not supported")
  }
  const tl = ((tag & 0x0f) << 4) | length
  return Buffer.concat([Buffer.from([tl]), value])
}