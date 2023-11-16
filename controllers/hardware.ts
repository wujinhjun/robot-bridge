import express, { Request, Response, NextFunction } from 'express';
import { SerialPort } from 'serialport';

const hardwareRouter = express.Router();
const portName = 'COM3';



hardwareRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  console.log(req);

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


// 辅助函数需要能够判断当前串口是否正确

// 如果不正确，则需要返回错误信息，正确则发送校验信息

hardwareRouter.post(
  '/led',
  async (req: Request, res: Response, next: NextFunction) => {
    const serialPort = new SerialPort({ path: portName, baudRate: 9600 });
    const data = req.body;
    
    console.log(data);
    serialPort.write(`${data.data ? 'a' : 'b'}@`);
    console.log(serialPort);

    res.json({ data: 'yes' });
  }
);

export default hardwareRouter;
