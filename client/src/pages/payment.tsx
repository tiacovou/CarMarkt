import { useState, useEffect } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, XIcon } from "lucide-react";
import OneTimePaymentForm from "@/components/payment/OneTimePaymentForm";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Payment() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const type = searchParams.get('type') || 'listing';
  const carId = searchParams.get('carId');
  
  const [clientSecret, setClientSecret] = useState("");
  const [paymentSuccessful, setPaymentSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Validate parameters
    if (type === 'listing' && !carId) {
      setError("Missing car ID for listing payment");
      setIsLoading(false);
      return;
    }
    
    // Create a payment intent as soon as the page loads
    const getPaymentIntent = async () => {
      try {
        const res = await apiRequest("POST", "/api/create-payment-intent", { 
          amount: 1, // €1.00
          description: type === 'listing' ? "Car listing renewal" : "Payment"
        });
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || "Failed to create payment intent");
      } finally {
        setIsLoading(false);
      }
    };
    
    getPaymentIntent();
  }, [user, type, carId, navigate]);
  
  const handlePaymentSuccess = () => {
    setPaymentSuccessful(true);
  };
  
  const handleGoToListing = () => {
    if (type === 'listing' && carId) {
      navigate(`/cars/${carId}`);
    } else {
      navigate('/profile');
    }
  };
  
  if (!user) {
    return null; // Will redirect to auth
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Preparing payment...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <XIcon className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-center">Error</h1>
            <p className="text-center text-gray-600">{error}</p>
            <Button onClick={() => navigate("/profile")} className="mt-4">
              Return to Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (paymentSuccessful) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-center">Payment Successful</h1>
            <p className="text-center text-gray-600">
              {type === 'listing' 
                ? "Your car listing has been renewed for another month." 
                : "Your payment has been processed successfully."}
            </p>
            <Button onClick={handleGoToListing} className="mt-4">
              {type === 'listing' ? "View Your Listing" : "Return to Profile"}
            </Button>
          </div>
        </div>
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
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container max-w-md mx-auto py-12">
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Profile
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6">
            {type === 'listing' ? "Renew Your Car Listing" : "Payment"}
          </h1>
          
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="font-semibold text-blue-800 mb-2">Payment Details</h2>
            <p className="text-sm text-blue-700">
              {type === 'listing' 
                ? "You are paying €1.00 to renew your car listing for another month." 
                : "Complete your payment below."}
            </p>
          </div>
          
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <OneTimePaymentForm 
              amount={1.00} 
              description={type === 'listing' ? "Car listing renewal" : "Payment"}
              type={type === 'listing' ? "listing" : "premium"}
              carId={carId || undefined}
              onSuccess={handlePaymentSuccess} 
            />
          </Elements>
          
          <div className="mt-6 text-xs text-center text-gray-500">
            Your payment is processed securely through Stripe.
            <br />
            We do not store your card details.
          </div>
        </div>
      </div>
    </div>
  );
}