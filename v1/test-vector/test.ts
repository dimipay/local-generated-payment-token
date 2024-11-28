import { Params, createToken, AuthType } from "."

const params = new Params({
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
})

const token = createToken(params)

console.log(token)