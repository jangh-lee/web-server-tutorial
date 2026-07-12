# Chapter 1. Postman & API Server

투두리스트 UI와 함께 CRUD API를 실습하기 위한 예제입니다.

## 실행 방법

```bash
npm install
npm start
```

기본 주소:

- 메인 페이지: `http://localhost:3000`
- API 가이드: `http://localhost:3000/guide`
- API 헬스체크: `http://localhost:3000/api/health`

## Ubuntu 서버 설치 스크립트

서버에서 바로 실행하려면 [install.sh](/Users/james/Documents/공모전/web-server-tutorial/chapter1/install.sh)를 사용하면 됩니다.

```bash
chmod +x install.sh
sudo ./install.sh
```

이 스크립트는 아래 작업을 한 번에 처리합니다.

- `nodejs`, `npm` 설치
- `npm install` 실행
- `chapter1-todo-api.service` systemd 서비스 등록
- 서버 재부팅 후에도 자동 실행되도록 설정

공개 리포 기준으로 바로 복붙할 수 있는 예시는 아래입니다.

```bash
sudo apt-get update && sudo apt-get install -y git
git clone https://github.com/jangh-lee/web-server-tutorial.git
cd web-server-tutorial/chapter1
chmod +x install.sh
sudo ./install.sh
```

설치 후 확인:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/todos
```

## API 목록

- `GET /api/todos`: 전체 할 일 조회
- `GET /api/todos/:id`: 단건 조회
- `POST /api/todos`: 새 할 일 생성
- `PUT /api/todos/:id`: 전체 수정
- `PATCH /api/todos/:id`: 일부 수정
- `DELETE /api/todos/:id`: 삭제

학생용 요청 예시를 한 화면에서 보려면 `/guide` 페이지를 열면 됩니다.

## GET 예시

전체 목록 조회:

```bash
curl http://localhost:3000/api/todos
```

단건 조회:

```bash
curl http://localhost:3000/api/todos/todo-1
```

## POST 예시

```json
{
  "title": "Postman으로 새 할 일 만들기",
  "note": "body를 JSON으로 보내기",
  "weather": "sunny",
  "plannedHour": "10",
  "plannedMinute": "30",
  "checkedHour": "",
  "checkedMinute": "",
  "done": false
}
```

```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Postman으로 새 할 일 만들기",
    "note": "body를 JSON으로 보내기",
    "weather": "sunny",
    "plannedHour": "10",
    "plannedMinute": "30",
    "checkedHour": "",
    "checkedMinute": "",
    "done": false
  }'
```

## PUT 예시

```json
{
  "title": "수정된 할 일 제목",
  "note": "PUT으로 전체 수정",
  "weather": "cloudy",
  "plannedHour": "14",
  "plannedMinute": "00",
  "checkedHour": "14",
  "checkedMinute": "20",
  "done": true
}
```

`PUT`은 전체 필드를 다시 보내는 방식입니다.

```bash
curl -X PUT http://localhost:3000/api/todos/todo-1 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 할 일 제목",
    "note": "PUT으로 전체 수정",
    "weather": "cloudy",
    "plannedHour": "14",
    "plannedMinute": "00",
    "checkedHour": "14",
    "checkedMinute": "20",
    "done": true
  }'
```

## PATCH 예시

```json
{
  "done": true,
  "checkedHour": "16",
  "checkedMinute": "40"
}
```

`PATCH`는 바꾸고 싶은 필드만 보내면 됩니다.

```bash
curl -X PATCH http://localhost:3000/api/todos/todo-1 \
  -H "Content-Type: application/json" \
  -d '{
    "done": true,
    "checkedHour": "16",
    "checkedMinute": "40"
  }'
```

## DELETE 예시

`DELETE`는 body 없이 `id`만 지정해서 호출합니다.

```bash
curl -X DELETE http://localhost:3000/api/todos/todo-1
```

## 실습 순서 예시

1. `GET /api/todos`로 현재 목록을 확인합니다.
2. `POST /api/todos`로 새 항목을 만듭니다.
3. 응답으로 받은 `id`로 `GET /api/todos/:id`를 호출합니다.
4. 같은 `id`로 `PUT /api/todos/:id`를 호출합니다.
5. 같은 `id`로 `PATCH /api/todos/:id`를 호출합니다.
6. 마지막으로 `DELETE /api/todos/:id`를 호출합니다.
