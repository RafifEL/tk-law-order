import express, { json } from 'express';
import mongoose from 'mongoose';
import OrderRouter from './routes';
import cors from 'cors';

async function main() {
  await mongoose.connect('mongodb://localhost:27017', {
    dbName: 'order_law',
    autoIndex: true,
    autoCreate: true,
  });

  const app = express();
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    })
  );

  app.use(
    cors({
      origin: '*',
    })
  );

  app.use(OrderRouter);

  app.listen(3030, () => {
    console.log('App start at port 3030');
  });
}

main();
