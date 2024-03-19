"use client";

import { useState } from "react";

import { useToast } from "@/components/ui/use-toast";

import { Button } from "../ui/button";
import { createTransaction } from "@/lib/actions/transaction.action";

declare type userProp = {
  _id: string,
  clerkId: string,
  email: string,
  username: string,
  photo: string,
  firstName?: string | null,
  lastName?: string | null,
  planId: number,
  creditBalance: number,
  __v?: number,
}

declare type transactionObject = {
  plan: string;
  amount: number;
  credits: number;
  buyerId: string;
};

interface RazorpayOptions {
  key: string | undefined;
  name: string;
  currency: string;
  amount: number;
  order_id: string;
  description: string;
  image: string;
  handler: (response: { razorpay_payment_id: string }) => void;
  prefill: {
      name: string;
      email: string;
  };
}

declare global {
  interface Window {
      Razorpay: {
          new (options: RazorpayOptions): {
              open(): void;
              // Add other methods if needed
          };
      };
  }
}

const Checkout = ({
  plan,
  amount,
  credits,
  user,
}: {
  plan: string;
  amount: number;
  credits: number;
  user: userProp;
}) => {
  const { toast } = useToast();

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  const capturePaymentToDB = async (paymentData: any) => {
    try {
      const transaction: any = {
        razorpayId: paymentData?.razorpay_payment_id,
        amount: amount ?? 0,
        plan: plan || "",
        credits: Number(credits) || 0,
        buyerId: user?._id || "",
        createdAt: new Date(),
      };
      const newTransaction = await createTransaction(transaction);
      if(newTransaction) {
        toast({
          title: "Order placed!",
          description: "Credits added, You will receive an email confirmation",
          duration: 5000,
          className: "success-toast",
        });
      }
    } catch (error) {
      console.error('Error in capturePaymentToDB', error);
    }
  }

  const makePayment = async (transaction: transactionObject) => {
    try {
      const res = await initializeRazorpay();
      if (!res) {
        alert("Razorpay SDK Failed to load");
        return;
      }
      // Make API call to the serverless API
      const data = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxAmt: transaction?.amount ?? 0,
        }),
      }).then((t) => t.json());

      const options: RazorpayOptions = {
        key: process.env.RAZORPAY_KEY,
        name: "Imaginify",
        currency: data?.data?.currency,
        amount: data?.data?.amount,
        order_id: data?.data?.id,
        description: "Thankyou for your Credit Purchase",
        image: "/assets/images/logo-text.svg",
        handler: function (response: any) {
          console.log("respinse", response);
          capturePaymentToDB(response);
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
        },
      };
      
      const paymentObject: any = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Error in makePayment", error);
    }
  };

  const onCheckout = async (event: any) => {
    event.preventDefault();
    const transaction = {
      plan,
      amount,
      credits,
      buyerId: user?._id,
    };
    await makePayment(transaction);
  };

  return (
    <form onSubmit={onCheckout} method="POST">
      <section>
        <Button
          type="submit"
          role="link"
          className="w-full rounded-full bg-purple-gradient bg-cover"
        >
          Buy Credit
        </Button>
      </section>
    </form>
  );
};

export default Checkout;
