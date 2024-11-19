# TLV (Tag-Length-Value) Format

TLV는 페이로드 값을 유연하게 저장하고 확장하기위해 v0.4부터 도입한 장치입니다.

일반적으로 태그와 길이는 1~4바이트로 표시되지만, LGPT는 최대한 짧은 길이의 토큰을 만드는 것이 목표이므로 일부 제약 사항을 가지고 1바이트로 태그와 길이 정보를 저장합니다.

태그(Tag) 값은 `t`, 길이(Length) 값은 `l`, `t`와 `l`을 합친 1바이트 값은 `tl`이라고 부릅니다.
그리고 저장하는 실제 값은 `v`, `tl`과 `v`를 합친 블록은 `tlv`로 부릅니다. `tlv`의 집합은 페이로드(payload)입니다.

```text
  0001   0010  00000000 ... 0000   0001   0010  00000000 ... 0000
├ tag ┘└ len ┤└      value      ┤ ├ tag ┘└ len ┤└      value      ┤
├     tl     ┘                  │ ├     tl     ┘                  │
├────────────  tlv  ────────────┘ └────────────  tlv  ────────────┤
└                             payload                             ┘
```

> [!INFO]
> 메타데이터 페이로드는 예외적으로 TLV 포멧을 사용하지 않습니다.

## Tag

태그(Tag)는 `tl`의 앞 4비트에 표현됩니다. 사용할 수 있는 태그의 수는 16개이고, 이는 현재 사양에서 사용하는 값들(device id, user id 등)을 구분하기에 충분합니다.

현재 정의된 태그는 다음과 같습니다.

| tag (dec) | tag (bin) | name                      |
| --------- | --------- | ------------------------- |
| 1         | 0001      | Auth type                 |
| 2         | 0010      | Auth Token                |
| 3         | 0011      | User Identifier           |
| 4         | 0100      | Device Identifier         |
| 5         | 0101      | Payment Method Identifier |
| 6         | 0110      | Nonce                     |

## Length

길이(Length)는 `tl`의 뒤 4비트로 표현됩니다. `l`은  `v`가 `2^l` 바이트임을 나타냅니다.

저장하는 값을 모두 `2^n` 바이트로 나타내야 한다는 제약이 이상적이지 않다고 생각할 수 있지만, 이는 대부분의 경우를 다루기에 충분한 접근 방법입니다.


## Examples

UUID(128-bit) Auth Token을 TLV로 저장하면 다음과 같습니다.

```javascript
function getTLV(t, v) {
  const l = Math.log2(v.length)

  if(!Number.isInteger(l) || l < 0 || l > 5) {
    throw new Error('Invalid value')
  }

  const tl = ((t & 0x0f) << 4) | l

  return Buffer.concat([Buffer.from([tl]), v])
}

function extractTLV(tlv) {
  const tl = tlv[0]
  const t = (tl & 0xf0) >>> 4
  const l = 2 ** (tl & 0x0f)
  const v = tlv.subarray(1)

  if(v.length !== l) {
    throw new Error('Invalid value')
  }

  return { t, l, v }
}

const t  = 0b0010 // Auth Token
const token = Buffer.from('d3350ed8c19a4d0fb064040bbc12ea8d', 'hex')
const tlv = getTLV(t, token)
console.log(tlv) //  <Buffer 24 d3 35 0e d8 c1 9a 4d 0f b0 64 04 0b bc 12 ea 8d> 

const e = extractTLV(tlv)
console.log(e)
// {
//   t: 2,
//   l: 16,
//   v: <Buffer d3 35 0e d8 c1 9a 4d 0f b0 64 04 0b bc 12 ea 8d>
// }
```