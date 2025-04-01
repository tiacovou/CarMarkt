import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation, Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Check, Loader2, XIcon } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/profile',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded if no error and no redirect needed
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        
        // Redirect to profile after successful payment
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1000);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Create PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        const res = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: 1, // €1.00 for car listing
          description: "Car listing fee"
        });
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || "Failed to create payment intent");
      } finally {
        setIsLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [user, navigate]);

  if (!user) {
    return null; // Will redirect to auth
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Setting up payment...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XIcon className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/profile")}>
              Return to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (paymentSuccessful) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Payment Successful</CardTitle>
            <CardDescription>
              Your payment has been processed successfully. You can now post your car listing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/profile")}>
              Go to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Initializing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Profile
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Payment</CardTitle>
            <CardDescription>
              You're paying €1.00 for listing a car on CarMarkt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
            
            <div className="mt-6 text-xs text-center text-gray-500">
              Your payment is processed securely through Stripe.
              <br />
              We do not store your card details.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}