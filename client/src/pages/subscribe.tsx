import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, XIcon, RefreshCw, Check as CheckIcon } from "lucide-react";
import OneTimePaymentForm from "@/components/payment/OneTimePaymentForm";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Subscribe() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionSuccessful, setSubscriptionSuccessful] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (user.isPremium) {
      setError("You are already a premium member");
      setIsLoading(false);
      return;
    }
    
    // Create a subscription as soon as the page loads
    const createSubscription = async () => {
      try {
        const res = await apiRequest("POST", "/api/create-subscription", {});
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        setError(err.message || "Failed to create subscription");
      } finally {
        setIsLoading(false);
      }
    };
    
    createSubscription();
  }, [user, navigate]);
  
  const handleSubscriptionSuccess = () => {
    setSubscriptionSuccessful(true);
  };
  
  if (!user) {
    return null; // Will redirect to auth
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Preparing your subscription...</p>
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
  
  if (subscriptionSuccessful) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-center">Subscription Successful</h1>
            <p className="text-center text-gray-600">
              You are now a premium member with unlimited car listings!
            </p>
            <Button onClick={() => navigate("/profile")} className="mt-4">
              Go to Your Profile
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
          <p className="text-lg">Setting up subscription...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 container max-w-lg mx-auto py-12">
        <div className="mb-6">
          <Link href="/profile" className="inline-flex items-center text-sm text-primary hover:text-primary/80">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Profile
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold mb-6">
            Premium Membership
          </h1>
          
          <div className="mb-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">Premium Benefits</h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Post unlimited car listings (1 free + pay for more)</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Automatic listing renewals</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Priority customer support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Enhanced visibility for your listings</span>
                </li>
              </ul>
              
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-blue-900">€5</span>
                  <span className="text-blue-700">/month</span>
                </div>
                <div className="flex items-center text-blue-700 text-sm">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  1 free listing + unlimited additional listings
                </div>
              </div>
            </div>
          </div>
          
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <OneTimePaymentForm
              amount={5.00}
              description="Premium membership subscription"
              type="premium"
              onSuccess={handleSubscriptionSuccess}
            />
          </Elements>
          
          <div className="mt-6 text-xs text-center text-gray-500">
            Your subscription is processed securely through Stripe.
            <br />
            You can cancel anytime. We do not store your card details.
          </div>
        </div>
      </div>
    </div>
  );
}