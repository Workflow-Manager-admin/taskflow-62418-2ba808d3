#!/bin/bash
cd /home/kavia/workspace/code-generation/taskflow-62418-2ba808d3/todo_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

