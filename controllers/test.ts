import express, { Request, Response, NextFunction } from 'express';
import { SerialPort } from 'serialport';
import fs from 'fs';
import path from 'path';
const audioPath = './speech.mp3';

const testRouter = express.Router();

testRouter.post('/sse', (req, res) => {
  const body = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let count = 0;

  // Send a message every second with an increasing counter
  const intervalId = setInterval(() => {
    count++;
    const eventData = {
      event: 'update',
      data: {
        message: `Update ${count}`,
        timestamp: new Date().toISOString(),
      },
    };
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  }, 1000);

  // Close the connection after 20 seconds
  setTimeout(() => {
    clearInterval(intervalId);
    res.end();
  }, 20000);
});

testRouter.post('/audio', (req, res) => {
  const body = req.body;
  const audio = fs.readFileSync(audioPath);
  res.setHeader('Content-Type', 'audio/mp3');
  res.sendFile(path.resolve(audioPath));
});

export default testRouter;
