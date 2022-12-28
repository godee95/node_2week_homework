# node_2week_homework
### 내일배움캠프 4기 NODE.JS 숙련주차 개인과제
### BackEnd

* sequelize-mySQL
* middleware-jwt login/logout
* express

---

> 게시글 CRUD

> 게시글 댓글 CRUD

회원만 작성, 삭제, 수정 가능 / 조회는 회원이 아니여도 가능

---

#### API 및 코드 상세

[tistory_blog](https://pangeei-h.tistory.com/entry/Nodejs-%EC%88%99%EB%A0%A8%EC%A3%BC%EC%B0%A8-%EC%88%99%EC%A0%9C-%EC%B5%9C%EC%A2%85-%EC%A0%9C%EC%B6%9C)

---

### 실행(Terminal)

```bash
git clone https://github.com/godee95/node_2week_homework
npm i

```

### 본인 AWS RDS 계정과 연결

/config/config.json
```
  "development": {
    "username": "root",
    "password": "비밀번호",
    "database": "database_development",
    "host": "엔드포인트",
    "dialect": "mysql"
  },
```

### Terminal
```bash
npx sequelize db:create
npx sequelize db:migrate

node app.js
```
