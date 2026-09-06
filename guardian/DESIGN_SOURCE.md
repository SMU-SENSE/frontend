# 말모아 디자인 소스 기준

이 Guardian 프론트의 로그인·회원가입·약관·연결·사용자 온보딩·공통 오류 UI는
예서님이 전달한 `말모아 (1).zip` 내 Figma export를 원본으로 사용한다.

## 원본 화면

- 00 시작
- 01 이메일 로그인
- 01-A 비밀번호 찾기
- 01-A-2 비밀번호 재설정
- 02 회원가입
- 03 이메일 인증
- 04 인증 완료
- 05 약관 동의
- 05-A 서비스 이용약관
- 05-B 개인정보 처리방침
- 06 / 06-B QR 연결
- 07 / 07-B 초대 코드
- 09 / 09-B / 09-C / 09-D 사용자 프로필 상태
- 10 화면 격자 설정
- 11 TTS 음성 설정
- 12 가입정보 확인
- SYS-01 / SYS-02 / SYS-03 공통 오류
- UI States

## 원본 아이콘

아래 PNG 원본을 `public/design/yeoseo/`에 바이트 그대로 보존하고 `yeoseo-source.css`에서 직접 참조한다.

- email-glyph.png (14×14)
- icon/play.png (32×32)
- icon/play-sm.png (20×20)
- icon/check.png (32×32)
- icon/chevron-right.png (20×20)
- icon/camera.png (28×28)
- icon/speaker.png (20×20)
- icon/person.png (20×20)
- icon/link.png (20×20)

동일한 기능의 Lucide 아이콘이 있더라도, Figma export가 제공된 위치에서는 원본 자산을 우선한다.

## Foundation 색상

- Navy `#06054F`
- Green `#149E69`
- Green Hover `#0F7A52`
- Green Pressed `#0A6140`
- Light Green `#E6F7F1`
- Gray 100 `#F0F0F4`
- Gray 300 `#CFCED7`
- Gray 500 `#A3A2B0`
- Error `#E53E3E`
- Kakao Yellow `#FEE500`

새 화면을 임의로 기존 화면 스타일에 섞지 않는다. 원본에 없는 화면은 별도 디자인 확인 후 추가한다.

## 원본 범위 밖 기능

윤지님 Guardian 알림 API처럼 Figma handoff에 화면이 없는 기능은 API 연결 코드는 유지할 수 있지만,
새 시각 UI를 최종 디자인으로 간주하지 않는다. 해당 화면/컴포넌트 원본이 전달되면 그 소스로 교체한다.
