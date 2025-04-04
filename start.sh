#!/bin/bash

# Start backend server
cd backend
npm run dev &

# Start frontend server
cd ../frontend
npm start 