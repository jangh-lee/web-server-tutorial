# Chapter 4. AI Fortune & Tarot Studio

네이버 클라우드의 CLOVA Studio API를 이용해 다음 기능을 시연하는 데모입니다.

- 사주/오늘의 운세 텍스트 생성
- 운세를 바탕으로 타로 카드풍 이미지 생성
- 이미지 URL 또는 업로드 파일 읽기
- 시스템 프롬프트 관리

## 구현 방향

공식 문서 기준으로 Chat Completions v3는 텍스트 생성과 이미지 이해를 지원합니다. 따라서 이 챕터는:

- 운세 텍스트: CLOVA Studio Chat Completions v3 호출
- 그림 읽기: HCX-005 비전 모델 호출
- 카드 이미지 생성: 텍스트 모델이 카드 사양 JSON 생성 → 서버가 SVG 카드 이미지로 렌더링

방식으로 구성했습니다.

## 공식 문서

- Chat Completions v3: [텍스트 및 이미지](https://api.ncloud-docs.com/docs/clovastudio-chatcompletionsv3)
- CLOVA Studio 개요: [CLOVA Studio 개요](https://api.ncloud-docs.com/docs/ai-naver-clovastudio-summary)

## 폴더 구성

- [server.js](/Users/james/Documents/공모전/web-server-tutorial/chapter4/server.js): API 서버
- [public/index.html](/Users/james/Documents/공모전/web-server-tutorial/chapter4/public/index.html): 메인 UI
- [public/app.js](/Users/james/Documents/공모전/web-server-tutorial/chapter4/public/app.js): 화면 로직
- [data/prompt-config.json](/Users/james/Documents/공모전/web-server-tutorial/chapter4/data/prompt-config.json): 관리자 프롬프트 설정
- [install.sh](/Users/james/Documents/공모전/web-server-tutorial/chapter4/install.sh): Ubuntu 설치 스크립트

## 실행 방법

```bash
cd chapter4
npm install
npm start
```

기본 접속 주소:

- 메인: `http://localhost:4100`

## Ubuntu 서버 설치

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/jangh-lee/web-server-tutorial.git
cd web-server-tutorial/chapter4
chmod +x install.sh
sudo ./install.sh
```

처음 실행하면 `.env` 템플릿이 자동 생성됩니다. 값을 채운 뒤 다시 실행하면 됩니다.

## `.env` 예시

```env
PORT=4100
CLOVA_BASE_URL="https://clovastudio.stream.ntruss.com"
CLOVA_API_KEY="nv-xxxx"
CLOVA_TEXT_MODEL="HCX-DASH-002"
CLOVA_VISION_MODEL="HCX-005"
ADMIN_PASSWORD="change-me"
DEMO_MODE_IF_NO_KEY="true"
```

## 화면 구성

### 1. 오늘의 사주

- 생년월일시 입력
- 양력/음력 선택
- 오늘의 운세 텍스트 응답

### 2. 그림 생성 / 읽기

- 운세 요약을 바탕으로 타로 카드풍 SVG 생성
- 이미지 URL 또는 업로드 파일을 비전 모델로 읽기

### 3. 프롬프트 관리자

- 운세 시스템 프롬프트
- 카드 생성 시스템 프롬프트
- 이미지 읽기 시스템 프롬프트

## 참고

`CLOVA_API_KEY`가 비어 있고 `DEMO_MODE_IF_NO_KEY="true"`이면, API 키 없이도 화면 흐름을 확인할 수 있는 데모 응답으로 동작합니다.
