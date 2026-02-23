# TutorMatch Backend (Node.js + MongoDB)

## Setup

1) Create environment file `.env` in `server/` based on below:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tutormatch
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=7d
```

2) Install and run

```
npm install
npm run dev
```

You should see: `TutorMatch API listening on port 5000` and `MongoDB connected: 127.0.0.1`.

Verify in browser: `http://localhost:5000/api/health`

## MongoDB Compass

- Connect to `mongodb://127.0.0.1:27017`
- Database `tutormatch` will appear after first write.

## Create Admin, Teacher, Student (basic)

POST http://localhost:5000/api/admin/users

Body (JSON):

```
{
  "name": "Alice Admin",
  "email": "admin@tm.com",
  "role": "admin",
  "password": "secret123"
}
```

Replace role with `teacher` or `student` and include optional fields: `subjects`, `gradeLevels`, `bio`.

## Project Scripts

- `npm run dev` – start with nodemon
- `npm start` – production start

## Directory Structure

```
src/
  index.js
  lib/mongo.js
  middleware/error.js
  models/{User,Course,Request,Session,Payment}.js
  routes/{health,admin}.js
```