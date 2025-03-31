import { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing VITE_STRIPE_PUBLIC_KEY");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user-profile?tab=subscriptions&status=success`,
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border p-4">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>Subscribe - €5.00/month</>
        )}
      </Button>
    </form>
  );
}

export default function SubscriptionForm() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const createSubscription = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-subscription");
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to create subscription");
        }
        
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Failed to setup subscription",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createSubscription();
  }, [toast]);
  
  if (isLoading || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold">Premium Subscription</h3>
        <p className="text-muted-foreground">
          Upgrade to our premium plan to post unlimited car listings.
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex justify-between">
            <span>Premium Membership</span>
            <span>€5.00/month</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-2">
            <span>Benefits:</span>
            <span>Unlimited listings</span>
          </div>
        </div>
      </div>
      
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}