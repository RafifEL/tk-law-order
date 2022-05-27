import express, { NextFunction, Request, Response } from 'express';
import { IOrder, Order } from './models/order';
import fetch from 'node-fetch';
import FormData from 'form-data';

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  try {
    if (!authorization) {
      return res.status(403).json({
        error: 'no_token',
        description: 'Access Token Required',
      });
    }

    const [method, token] = authorization.split(' ');

    if (method !== 'Bearer') {
      return res.status(403).json({
        error: 'wrong_method',
        description: 'Not Bearer Auth Method',
      });
    }

    if (!token) {
      return res.status(403).json({
        error: 'no_token',
        description: 'Access Token Required',
      });
    }

    const response = await fetch(
      'http://tk.oauth.getoboru.xyz/token/resource',
      {
        method: 'get',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.status !== 200) throw new Error('Invalid Token');
    const data = await response.json();

    (req as any).auth = { user: data?.data, token };
  } catch (err) {
    return res.status(403).json({
      error: 'invalid_token',
      description: 'Invalid Token',
    });
  }
  return next();
};

const OrderRouter = express.Router();
OrderRouter.use(verifyToken);

export interface OrderCreateReq extends Request {
  body: IOrder;
}

OrderRouter.get(
  '/orders',
  async (req: Request & { params: { username: string } }, res: Response) => {
    const { user } = (req as any).auth;
    const order = await Order.find({ username: user.username || '' });
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

    const response = await fetch(
      `http://tk.ordersummary.getoboru.xyz/orderSummary/${id}`,
      {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (response.status !== 200) throw new Error('Tidak cukup saldo');

    const dataSummary = await response.json();
    return res.json({
      data: { ...order.toJSON(), summary: dataSummary?.data?.downloadLink },
    });
  }
);

OrderRouter.post('/order', async (req: OrderCreateReq, res: Response) => {
  try {
    const { token, user } = (req as any).auth;
    const { username, nama, alamat, orderItems, deliveryService } = req.body;
    const order = await Order.create({
      username: user?.username || '',
      nama: user.nama || '',
      alamat: user.alamat || '',
      orderItems,
      deliveryService,
    });

    const formData = new FormData();
    console.log({
      username,
      nominal: orderItems.reduce(
        (prev, cur) => prev + Number(cur.price) * cur.quantity,
        0
      ),
    });
    formData.append('username', user?.username || '');
    formData.append(
      'nominal',
      orderItems.reduce(
        (prev, cur) => prev + Number(cur.price) * cur.quantity,
        0
      )
    );

    const responseEwallet = await fetch(
      'https://e-market-wallet.herokuapp.com/api/e-wallet/bayar',
      {
        method: 'post',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(responseEwallet.status);
    console.log(responseEwallet.statusText);
    console.log(responseEwallet);
    if (responseEwallet.status !== 200) throw new Error('Tidak cukup saldo');

    const response = await fetch(
      'http://tk.ordersummary.getoboru.xyz/orderSummary',
      {
        method: 'post',
        body: JSON.stringify({
          orderId: order.id,
          customerName: order.nama,
          customerAddress: order.alamat,
          deliveryService: 'AnterSekalian',
          orderItems,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const dataSummary = await response.json();
    return res.status(201).json({
      data: { ...order.toJSON(), summary: dataSummary?.data?.downloadLink },
    });
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
