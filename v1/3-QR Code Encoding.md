# QR Code Encoding

계산된 결제 토큰을 [Base45](https://www.rfc-editor.org/rfc/rfc9285.html)로 인코딩합니다. 그리고 다음 파라미터를 사용하여 QR코드를 생성합니다.

- 모드(Mode): Alphanumeric
- 에러 정정 레벨(Error correction level): L, M, Q, H
- 버전(Symbol Version): 가능한 가장 작은 버전 사용

## Error Correction Level

QR코드는 사용자 기기의 스크린을 통해 나타납니다. 그리고 기기는 QR의 흑백을 뚜렷하게 구별하기 위해 화면 밝기를 최대로 올릴 것입니다. 그래서 일반적인 상황에선 에러 정정 레벨을 L 또는 M으로 사용해도 문제가 없을 것입니다. 하지만 항상 밝기가 최대로 올라간다고 보장할 순 없습니다. 이런 예외 상황에서만 에러 정정 레벨을 Q또는 H로 사용하도록 설계할 수 있습니다. 이 부분은 실제 사용하는 QR 리더기로 테스트해 보며 조절해야 합니다.

## Maximum Version

QR 코드의 버전은 13을 넘기지 않을 것을 권장합니다. Base45 인코딩을 사용하면 오류 레벨이 L일 때 버전 13의 QR 코드에서 최대 412바이트를 저장할 수 있습니다.

QR 코드 용량과 인코딩에 대한 자세한 내용은 [QR 코드에 최대한 많이 때려 넣기](https://blog.javien.dev/6)를 참고해 주세요.
