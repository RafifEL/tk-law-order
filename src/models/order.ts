/* eslint-disable no-unused-vars */
import mongoose from 'mongoose';

export interface IOrder {
  username: string;
  nama: string;
  alamat: string;
  deliveryService: string;
  orderItems: {
    name: string;
    image?: string;
    price: string;
    quantity: number;
  }[];
}

interface OrderDoc extends IOrder, mongoose.Document {}

const orderItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: false,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

orderItemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

const orderSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  nama: {
    type: String,
    required: true,
  },
  alamat: {
    type: String,
    required: true,
  },
  deliveryService: {
    type: String,
    required: false,
  },
  orderItems: {
    type: [orderItemSchema],
    required: true,
  },
});

orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

export const Order = mongoose.model<OrderDoc>('Order', orderSchema);
