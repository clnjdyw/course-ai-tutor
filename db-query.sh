#!/bin/bash
# 在 Docker 容器中查询 SQLite 数据库
# 用法: ./db-query.sh "SELECT * FROM users"

docker exec course-ai-tutor-backend sh -c "node --input-type=module -e \"
import initSqlJs from 'sql.js';
import fs from 'fs';
const SQL = await initSqlJs({locateFile: f => '/app/node_modules/sql.js/dist/' + f});
const buf = fs.readFileSync('/app/data/course-ai-tutor.db');
const db = new SQL.Database(buf);
const result = db.exec(\\\"${1}\\");
console.log(JSON.stringify(result, null, 2));
\""
