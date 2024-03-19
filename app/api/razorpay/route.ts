import { NextResponse } from "next/server";

//razorpay.js
import Razorpay from 'razorpay';
import shortid from 'shortid';

export async function POST(req: Request) {
  const paymentReq = await req.json();
  // Initialize razorpay object
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY || '',
    key_secret: process.env.RAZORPAY_SECRET,
  });

  // Create an order -> generate the OrderID -> Send it to the Front-end
  // Also, check the amount and currency on the backend (Security measure)
  const payment_capture = 1;
  const amount = paymentReq?.taxAmt;
  const currency = "INR";
  const options = {
    amount: (amount * 100).toString(),
    currency,
    receipt: shortid.generate(),
    payment_capture,
  };

  try {
    const response = await razorpay.orders.create(options);
    return NextResponse.json({ message: "OK", data: {
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    } });
  } catch (err) {
    //console.log(err);
    return new Response("Error occured", {
      status: 500,
    });
  }
}
