# Web Server Tutorial

간단한 웹 서버 실습을 두 단계로 나눠서 따라갈 수 있도록 구성한 튜토리얼 리포지토리입니다.

## Chapter 1. Postman & API Server

[`chapter1`](/Users/james/Documents/공모전/web-server-tutorial/chapter1)에는 투두리스트 느낌의 메인 사이트와 CRUD 실습용 API 서버가 들어 있습니다.

포함 내용:

- 브라우저에서 바로 보는 투두리스트 UI
- `GET`, `POST`, `PUT`, `PATCH`, `DELETE` 실습이 가능한 REST API
- Postman이나 `curl`로 바로 테스트 가능한 JSON 응답

실행 방법:

```bash
cd chapter1
npm install
npm start
```

접속 주소:

- 웹 페이지: `http://localhost:3000`
- API 헬스체크: `http://localhost:3000/api/health`
- 투두 목록: `http://localhost:3000/api/todos`

## Chapter 2. Load Balancer

[`chapter2`](/Users/james/Documents/공모전/web-server-tutorial/chapter2)는 Ubuntu 서버에 `nginx` 기반의 단순 백엔드 노드를 배포해서 로드밸런서 분산을 실습하는 예제입니다.

포함 내용:

- 설치 시 지정한 이름 표시
- 날짜, 시간, 호스트명, IP 정보 표시
- 헬스체크 경로 `/healthz`
- `hostname` 기준 100회 호출 분산 테스트 예시

실행 가이드는 [`chapter2/README.md`](/Users/james/Documents/공모전/web-server-tutorial/chapter2/README.md)에 정리되어 있습니다.

## Chapter 3. Multi-Tier Board

[`chapter3`](/Users/james/Documents/공모전/web-server-tutorial/chapter3)는 네이버클라우드 기준 3계층 게시판 실습입니다.

포함 내용:

- 웹서버 설치 스크립트
- 백엔드 서버 설치 스크립트
- DB 서버 설치 스크립트
- `.env` 기반 서버 간 엔드포인트 연결
- 비로그인 게시글 작성/삭제 게시판
- ACG와 네트워크 구성 가이드

## Chapter 4. AI Fortune & Tarot Studio

[`chapter4`](/Users/james/Documents/공모전/web-server-tutorial/chapter4)는 네이버 클라우드 CLOVA Studio API 기반 AI 데모입니다.

포함 내용:

- 사주/오늘의 운세 텍스트 생성
- 타로 카드풍 SVG 이미지 생성
- 이미지 읽기(비전 모델)
- 프롬프트 관리자 화면
- Ubuntu 설치 스크립트

## 추천 흐름

1. `chapter1`에서 API와 Postman CRUD 흐름을 익힙니다.
2. `chapter2`에서 여러 서버 노드를 띄운 뒤 로드밸런서 분산을 확인합니다.
3. `chapter3`에서 웹, 백엔드, DB를 나눠 3계층 구조를 실습합니다.
4. `chapter4`에서 AI 모델 호출과 프롬프트 관리 데모를 실습합니다.
