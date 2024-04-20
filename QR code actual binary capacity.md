# QR code actual binary capacity

[qrcode.com](https://www.qrcode.com/en/about/version.html)에서 QR 버전별로 저장 가능한  데이터 비트가 정리되어있다.

하지만 실제로 저장될 수 있는 데이터 양을 계산하기위해선 indicator mode Mode indicator 비트와 Charactor number indicator 비트를 고려해야한다.

아래 표는 바이너리 값만 저장할 때 실제로 저장할 수 있는 데이터 양을 나타낸다.

| Version | L                        | M                        |
| ------- | ------------------------ | ------------------------ |
| 10      | 2,180 bits / 272.5 bytes | 1,716 bits / 214.5 bytes |
| 11      | 2,572 bits / 321.5 bytes | 2,012 bits / 251.5 bytes |
| 12      | 2,940 bits / 367.5 bytes | 2,300 bits / 287.5 bytes |
| 13      | 3,404 bits / 425.5 bytes | 2,652 bits / 331.5 bytes |
| 14      | 3,668 bits / 458.5 bytes | 2,900 bits / 362.b bytes |

## How to calculate

계산 방법은 [Information capacity and Versions of the QR code](https://www.qrcode.com/en/about/version.html) 페이지의 "When different kind of character is mixed"에서 찾을 수 있다.
