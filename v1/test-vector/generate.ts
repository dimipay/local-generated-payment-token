import { randomBytes } from "crypto";
import { AuthType, Params, createToken } from ".";

interface Report {
  metadata: string
  common: {
    auithType: string
    userId: string
    paymentMethodId: string
  },
  private: {
    authToken: string
    deviceId: string
    nonce: string
  }
  t: number
  t0: number
  rk: string
  result: string
}

const reports: Report[] = []
const params: Params[] = [
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: AuthType.LOCAL_AUTH,
    userIdentifier: '320fae039d724c19816d2c2d1d5b7ca2',
    paymentMethodIdentifier: '01',

    authToken: 'adca79ec7934433cacc0a23088f39f58',
    deviceIdentifier: '265bed1a9b4a47fc8765b421d67a1458',
    nonce: '01934f0337777ac38dcb8066c646b7fb',

    t: 1721089757738,
    t0: 1705896544745,
    rootKey: 'c0093def64d3b1880da182de861cec39'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 27,
    userIdentifier: 'f2fb40859b5c59fed9b9b54f59fc27da',
    paymentMethodIdentifier: '02',

    authToken: 'f9532bbaccf95eb21f6b107f161a67a9',
    deviceIdentifier: '4b2a157e77a1450828f9835c5088efcd',
    nonce: '01937301ae8a7628be21e03facaa047b',

    t: 1721091799262,
    t0: 1721091504743,
    rootKey: 'a8f6536b5b3dc55bbbb0dfee0d34acdf'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 27,
    userIdentifier: 'c0516750760fb06be9316300b803719a',
    paymentMethodIdentifier: '03',

    authToken: '471937b351c08c70037cf24c73085468',
    deviceIdentifier: '3f0e811caa7dceb70a33ba177a9c454e',
    nonce: '01937301d2ec7da389cfb23bcfc17141',

    t: 1721091806967,
    t0: 1721091486103,
    rootKey: 'e5542261daa78083ae019ab1c68b4f3d'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 25,
    userIdentifier: '8a9d29df3ee2a686787d25ad95c30cf2',
    paymentMethodIdentifier: '04',

    authToken: 'e3345aa0730e5d15ef4cafefc6b8b99a',
    deviceIdentifier: '72f0c90ea76cfd6e756e3f659604c197',
    nonce: '01937301f0e8774eb84a3cfdb4fc9d37',

    t: 1721091801609,
    t0: 1721091781199,
    rootKey: '8cefb9563329ff5c4fa68cd0f07c2bc6'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 16,
    userIdentifier: '3a65ff711da3031aeae8e66ad01f151a',
    paymentMethodIdentifier: '00',

    authToken: '1a332a8f62675e5455b41bf11a84e947',
    deviceIdentifier: '2be20fd7b0983b96bf511be7b8eef0b9',
    nonce: '0193730211547d3b8f3b7b6f537b2c26',

    t: 1721091801385,
    t0: 1721091476210,
    rootKey: 'ec9b8bd4ccd739f502d60c2fd5e7724d'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 24,
    userIdentifier: '07ac33e8e1bbfd5832204b3e6e4009f1',
    paymentMethodIdentifier: '00',

    authToken: '6cedd43dfde81f1b4940b3222e8d3223',
    deviceIdentifier: '6d78cbd7098eb6eb7f5857a9b92568f5',
    nonce: '0193730234f9720da20a403d85e9f9fa',

    t: 1721091807335,
    t0: 1721091429128,
    rootKey: 'bc741d56733a8cb28782b79ac7701476'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 16,
    userIdentifier: '0f230d6bc71fa94a728b79eea8a05762',
    paymentMethodIdentifier: '03',

    authToken: '31c4204b096fc1524ef56f4ee7863633',
    deviceIdentifier: 'd597c5a4440d8152a2ad29e9bc6f907d',
    nonce: '019373024ff27f2fba9909e832cac3dd',

    t: 1721091801095,
    t0: 1721091524188,
    rootKey: '1a78404e42b03c65a3f457e10f69611c'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 16,
    userIdentifier: '5ca671d5a5685ff446c00596d3d07915',
    paymentMethodIdentifier: '00',

    authToken: '682e3c70cc033a904ac9017a3e7a6bec',
    deviceIdentifier: '093448bb907bf26ba0cd114093300d5d',
    nonce: '0193730270f47e26b44b234d07e36a86',

    t: 1721091807090,
    t0: 1721091435166,
    rootKey: '903ec6db8c9ae5845ec0d0d5b9414131'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 25,
    userIdentifier: '322faf1cf81c043a7a2905f106bcf5a1',
    paymentMethodIdentifier: '03',

    authToken: '7a939aceaab1e73d9b1067b3d17308d1',
    deviceIdentifier: '9412d41a8599d280f0f13a08554d4fdc',
    nonce: '019373028d98798abc82baae4cecd561',

    t: 1721091800529,
    t0: 1721091709745,
    rootKey: 'a4328f01328481d31774229cfdadc609'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 24,
    userIdentifier: '4232e35e09015d60d606956e9240fdeb',
    paymentMethodIdentifier: '02',

    authToken: '2075dea84c0bfabe769aac286d410de7',
    deviceIdentifier: 'd3f6f206da0fdf3200637757fdd3bb96',
    nonce: '01937302abaa7a1ebb8d5fd583816287',

    t: 1721091803324,
    t0: 1721091760503,
    rootKey: '45071199529b11a139a8bd3c43ad40ee'
  }),
  new Params({
    applicationIdentifier: '4450ffff',
    version: '04',

    authType: 27,
    userIdentifier: '2839da51b01ad7098e7aed1d9943745a',
    paymentMethodIdentifier: '01',

    authToken: '24bc64f30fadb1ab025079a46257419f',
    deviceIdentifier: '2b855aca9adb862f0fe0d38d921f58cc',
    nonce: '01934f0337777ac38dcb8066c646b7fb',

    t: 1721091802099,
    t0: 1721091646555,
    rootKey: '01937302d6ba7c62b7aca520be4ed927'
  })
]

for (const param of params) {
  const report: Report = {
    metadata: param.metadata.toString('hex'),
    common: {
      auithType: param.authType.toString(),
      paymentMethodId: param.paymentMethodIdentifier.toString('hex'),
      userId: param.userIdentifier.toString('hex')
    },
    private: {
      authToken: param.authToken.toString('hex'),
      deviceId: param.deviceIdentifier.toString('hex'),
      nonce: param.nonce.toString('hex')
    },
    rk: param.rootKey.toString('hex'),
    t: param.t,
    t0: param.t0,

    result: createToken(param),
  }
  reports.push(report)
}

await Bun.write('./test-vectors.json', JSON.stringify(reports, null, 2))
