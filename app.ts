import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import { Server as socketIO } from 'socket.io';
import Websocket from 'ws';
import fs from 'fs';
import { execSync, exec } from 'child_process';
import CryptoJS from 'crypto-js';
import 'dotenv/config';

const inputPath = './input.wav';
const outputFilePath = './output.pcm';

const XF_APP_ID = process.env.XF_APP_ID ?? '';
const XF_API_KEY = process.env.XF_API_KEY ?? '';

const XF_HOST_URL = 'wss://rtasr.xfyun.cn/v1/ws';

const ffmpegCommand = `ffmpeg -y -i ${inputPath} -acodec pcm_s16le -f s16le -ac 1 -ar 16000 ${outputFilePath}`;

import hardwareRouter from './controllers/hardware';
import testRouter from './controllers/test';

import baiduSISRouter from './controllers/baiduSpeech';

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

app.use('/api/speech', baiduSISRouter);

ioServer.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('chat audio', (msg) => {
    const data = msg;

    socket.emit('chat audio', { data, type: 'START' });

    fs.writeFileSync(inputPath, data.data);

    console.log('start exec');

    execSync(ffmpegCommand, { stdio: 'inherit' });

    // 华为的接口
    const result: string[] = [];

    const config = {
      file: outputFilePath,
      highWaterMark: 1280,
    };
    const ws = new Websocket(
      `wss://${data.endpoint}/v1/${data.projectId}/rasr/continue-stream`,
      {
        headers: {
          'X-Auth-Token': data.token,
        },
      },
    );

    ws.on('open', () => {
      const body = {
        command: 'START',
        config: {
          audio_format: 'pcm16k16bit',
          property: 'chinese_16k_general',
          add_punc: 'yes',
        },
      };

      ws.send(JSON.stringify(body));
    });

    ws.on('message', (msg) => {
      const data = JSON.parse(msg as unknown as string);
      //   console.log(msg.toSt);
      console.log(data);
      let resultStr = '';
      switch (data.resp_type) {
        case 'START':
          const readerStream = fs.createReadStream(config.file, {
            highWaterMark: config.highWaterMark,
          });

          readerStream.on('data', (chunk) => {
            ws.send(chunk);
          });

          readerStream.on('end', function () {
            // 最终帧发送结束
            ws.send('{"command": "END","cancel": false}');
          });
          break;
        case 'RESULT':
          console.log(data.segments[0].result.text);
          const text = data.segments[0].result.text;
          //   resultStr += result.segments[0].result.text;
          result.push(text);
          console.log(result);

          break;
        case 'END':
          console.log('转写完成');
          const summary = result.join('');

          if (summary.length === 0) {
            ioServer.emit('chat audio', {
              data: '没有识别到内容',
              type: 'ERROR',
            });
            return;
          }
          ioServer.emit('chat audio', {
            data: summary,
            type: 'RESULT',
          });
          break;
        case 'FATAL_ERROR':
          console.log('连接中断');
          break;
      }
    });

    ws.on('error', (err) => {
      console.log(err);
    });

    // end

    // // 讯飞的用法
    // let ts = Number.parseInt(String(new Date().getTime() / 1000));

    // const wssUrl =
    //   XF_HOST_URL +
    //   '?appid=' +
    //   XF_APP_ID +
    //   '&ts=' +
    //   ts +
    //   '&signa=' +
    //   getSigna(ts);

    // const config = {
    //   file: outputFilePath,
    //   highWaterMark: 1280,
    // };

    // const ws = new Websocket(wssUrl);
    // const result: any[] = [];

    // ws.on('open', () => {
    //   console.log('websocket connect!');
    // });

    // ws.on('message', (data, error) => {
    //   if (error) {
    //     console.error(error);
    //     return;
    //   }

    //   const res = JSON.parse(data as unknown as string);

    //   switch (res.action) {
    //     case 'error':
    //       console.log(`error code: ${res.code}, error message: ${res.desc}`);
    //       break;
    //     case 'started':
    //       console.log('started');
    //       console.log('sid is:' + res.sid);
    //       const readerStream = fs.createReadStream(config.file, {
    //         highWaterMark: config.highWaterMark,
    //       });

    //       readerStream.on('data', (chunk) => {
    //         // console.log(chunk.length);

    //         ws.send(chunk);
    //       });

    //       readerStream.on('end', function () {
    //         // 最终帧发送结束
    //         ws.send('{"end": true}');
    //       });
    //       break;
    //     case 'result':
    //       const data = JSON.parse(res.data);
    //       //   console.log('result is:' + res.result.ws);
    //       //   console.log(data.cn.st.rt);
    //       console.log(data);

    //       //   fs.writeFileSync('./test.txt', '\n');
    //       fs.appendFileSync('./test.txt', `\n${res.data}\n`);
    //       //   fs.writeFileSync('./test.txt', '\n');

    //       result[data.seg_id] = data;
    //       if (data.cn.st.type == 0) {
    //         result.forEach((item) => {
    //           let str = '实时转写';

    //           str +=
    //             item.cn.st.type === 0
    //               ? '【最终】识别结果：'
    //               : '【中间】识别结果：';

    //           item.cn.st.rt.forEach((rtItem: any) => {
    //             rtItem.ws.forEach((wsItem: any) => {
    //               wsItem.cw.forEach((cwItem: any) => {
    //                 str += cwItem.w;
    //               });
    //             });
    //           });

    //           console.log(str);
    //         });
    //       }
    //       break;
    //   }
    // });

    // ws.on('close', () => {
    //   console.log('websocket close!');
    // });

    // ws.on('error', (err) => {
    //   console.log('websocket error!');
    //   console.error(err);
    // });

    // // 结束
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// 鉴权签名
function getSigna(ts: number) {
  let md5 = CryptoJS.MD5(XF_APP_ID + ts).toString();
  let sha1 = CryptoJS.HmacSHA1(md5, XF_API_KEY);
  let base64 = CryptoJS.enc.Base64.stringify(sha1);
  return encodeURIComponent(base64);
}
