import express, { Request, Response, NextFunction } from 'express';
import { SerialPort } from 'serialport';

const hardwareRouter = express.Router();
const portName = 'COM3';

const serialPort = new SerialPort({ path: portName, baudRate: 9600 });

hardwareRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  console.log(req);

  res.send('hello');
});

hardwareRouter.post(
  '/led',
  async (req: Request, res: Response, next: NextFunction) => {
    const data = req.body;
    const list = await SerialPort.list();
    console.log(data);
    serialPort.write(`${data.data ? 'a' : 'b'}@`);
    console.log(serialPort);

    res.json({ data: 'yes' });
  }
);

export default hardwareRouter;
