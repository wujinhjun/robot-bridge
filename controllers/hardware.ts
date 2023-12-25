import express, { Request, Response, NextFunction } from 'express';
import { SerialPort } from 'serialport';
import fs from 'fs';

const hardwareRouter = express.Router();
const portStorage = './storage/serialPort.json';

// 从JSON中读取数据
const helperReadFromStorage = (path: string) => {
  return JSON.parse(fs.readFileSync(path).toString());
};

// 辅助函数需要能够判断当前串口是否正确
const helperTestCurrentSerial = async (path: string) => {
  const list = await SerialPort.list();

  //   通过校验生产厂商数据
  return (
    list.filter((item) => {
      return path === item.path && item?.vendorId === '1A86';
    }).length > 0
  );
};

hardwareRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.send('hello');
});

// 返回串口列表
hardwareRouter.get(
  '/serials',
  async (req: Request, res: Response, next: NextFunction) => {
    const list = await SerialPort.list();
    res.json(list);
  }
);

// 设置目标串口
hardwareRouter.post(
  '/serials',
  async (req: Request, res: Response, next: NextFunction) => {
    const targetSerial = req.body.serial;

    fs.writeFileSync(portStorage, JSON.stringify({ port: targetSerial }));

    res.json({ data: 'ok' });
  }
);

// 返回当前串口与状态
hardwareRouter.get(
  '/port',
  async (req: Request, res: Response, next: NextFunction) => {
    const { port } = helperReadFromStorage(portStorage);
    const status = await helperTestCurrentSerial(port);

    res.json({ data: { port, status } });
  }
);

// 如果不正确，则需要返回错误信息，正确则发送校验信息
hardwareRouter.post(
  '/led',
  async (req: Request, res: Response, next: NextFunction) => {
    const portData = fs.readFileSync(portStorage).toString();
    const portName = '';

    const serialPort = new SerialPort({ path: portName, baudRate: 9600 });
    const data = req.body;

    console.log(data);
    serialPort.write(`${data.data ? 'a' : 'b'}@`);
    console.log(serialPort);

    res.json({ data: 'yes' });
  }
);

export default hardwareRouter;
