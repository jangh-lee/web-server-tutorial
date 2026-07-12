# Chapter 1. Postman & API Server

투두리스트 UI와 함께 CRUD API를 실습하기 위한 예제입니다.

## 실행 방법

```bash
npm install
npm start
```

기본 주소:

- 메인 페이지: `http://localhost:3000`
- API 헬스체크: `http://localhost:3000/api/health`

## API 목록

- `GET /api/todos`: 전체 할 일 조회
- `GET /api/todos/:id`: 단건 조회
- `POST /api/todos`: 새 할 일 생성
- `PUT /api/todos/:id`: 전체 수정
- `PATCH /api/todos/:id`: 일부 수정
- `DELETE /api/todos/:id`: 삭제

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

## PATCH 예시

```json
{
  "done": true,
  "checkedHour": "16",
  "checkedMinute": "40"
}
```
