import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as socketIO } from 'socket.io';
import Websocket from 'ws';
import fs from 'fs';

import hardwareRouter from './controllers/hardware';
import testRouter from './controllers/test';

const app = express();
const server = http.createServer(app);
const ioServer = new socketIO(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express with TypeScript!');
});

app.use('/api/hardware', hardwareRouter);
app.use('/api/test', testRouter);

ioServer.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat audio', (msg) => {
    const data = msg;

    socket.emit('chat audio', data);

    const testAudio = fs.readFileSync('./speech.mp3');
    // console.log(data.data);
    const audioBuffer: Buffer = data.data;

    fs.writeFileSync('./test.pcm', audioBuffer);
    const audioList: Float32Array[] = [];

    const testAudioList: Buffer[] = [];

    // for (let i = 0; i < audioBuffer.length; i += 1600) {
    //   const chunk = audioBuffer.subarray(i, i + 1600);
    //   const chunk1 = testAudio.slice(i, i + 1600);
    //   audioList.push(chunk);

    //   testAudioList.push(chunk1);
    // }

    // const arrayList = audioBuffer.forEach((item,))

    const ws = new Websocket(
      `wss://${data.endpoint}/v1/${data.projectId}/rasr/continue-stream`,
      {
        headers: {
          'X-Auth-Token': data.token,
        },
      },
    );

    ws.onopen = () => {
      const data = '';
      const body = {
        command: 'START',
        config: {
          audio_format: 'pcm16k16bit',
          property: 'chinese_16k_general',
        },
      };

      ws.send(JSON.stringify(body));
    };

    ws.onmessage = (msg) => {
      console.log(JSON.parse(msg.data as string));

      const result = JSON.parse(msg.data as string);
      if (result.resp_type === 'START') {
        // console.log(audioBuffer.length);
        // console.log(audioList.length);

        // // ws.send(audioBuffer);
        // audioList.forEach((chunk, index) => {
        //   console.log(chunk);

        //   //   ws.send(chunk);
        //   console.log('send: ' + index);
        // });

        // ws.send(testAudio);

        console.log(testAudioList.length);
        // testAudioList.forEach((chunk, index) => {
        //   console.log(chunk);

        //   ws.send(chunk);
        //   console.log('send: ' + index);
        // });
        console.log('send');
      }

      // ws.send(JSON.stringify(bod));

      //   const dataKeys = Reflect.ownKeys(data);

      //   dataKeys.forEach((key) => {
      //     console.log(key, data[key]);
      //   });
      //   console.log(Reflect.get(data, Symbol('kData')));
      //   console.log(data[Symbol('kData')]);
    };

    ws.onerror = (err) => {
      console.error(err.message);
      //   console.log(err);
    };
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
