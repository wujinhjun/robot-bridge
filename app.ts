import express, { Request, Response } from 'express';
import cors from 'cors';

import hardwareRouter from './controllers/hardware';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use()

const port = 3000;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, Express with TypeScript!');
});

app.use('/api/hardware', hardwareRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
