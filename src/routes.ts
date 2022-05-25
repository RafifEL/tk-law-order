import express, { Request, Response } from 'express';
import { IOrder, Order } from './models/order';

const OrderRouter = express.Router();

export interface OrderCreateReq extends Request {
  body: IOrder;
}

OrderRouter.get(
  '/orders/:username',
  async (req: Request & { params: { username: string } }, res: Response) => {
    const { username } = req.params;
    const order = await Order.find({ username });
    if (!order) {
      return res.status(404).json({
        error: 'order_not_found',
        error_description: 'Order Tidak Ditemukan',
      });
    }
    return res.json({ data: order });
  }
);

OrderRouter.get(
  '/order/:id',
  async (req: Request & { params: { id: string } }, res: Response) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        error: 'order_not_found',
        error_description: 'Order Tidak Ditemukan',
      });
    }
    return res.json({ data: order });
  }
);

OrderRouter.post('/order', async (req: OrderCreateReq, res: Response) => {
  try {
    const { username, nama, alamat, orderItems, deliveryService } = req.body;
    const order = await Order.create({
      username,
      nama,
      alamat,
      orderItems,
      deliveryService,
    });
    return res.status(201).json({ data: order });
  } catch (err) {
    console.log(err);
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'ada kesalahan',
    });
  }
});

OrderRouter.put(
  '/order/:id',
  async (req: OrderCreateReq & { params: { id: string } }, res: Response) => {
    try {
      const { id } = req.params;
      const { orderItems } = req.body;
      const order = await Order.findByIdAndUpdate(id, { orderItems });

      if (!order) {
        return res.status(404).json({
          error: 'order_not_found',
          error_description: 'Order Tidak Ditemukan',
        });
      }

      return res.status(200).json({ data: order });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'ada kesalahan',
      });
    }
  }
);

OrderRouter.delete(
  '/order/:id',
  async (req: Request & { params: { id: string } }, res: Response) => {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({
        error: 'order_not_found',
        error_description: 'Order Tidak Ditemukan',
      });
    }
    return res.status(200).json({
      message: 'order Deleted',
      item: order.toJSON(),
    });
  }
);

export default OrderRouter;
