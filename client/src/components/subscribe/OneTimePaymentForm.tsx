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

interface CheckoutFormProps {
  description: string;
}

function CheckoutForm({ description }: CheckoutFormProps) {
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
          return_url: `${window.location.origin}/sell-car?status=success`,
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
          <>Pay €1.00</>
        )}
      </Button>
    </form>
  );
}

interface OneTimePaymentFormProps {
  amount?: number;
  description?: string;
  onCancel?: () => void;
}

export default function OneTimePaymentForm({ 
  amount = 1.00, 
  description = "Additional Car Listing",
  onCancel
}: OneTimePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount,
          description
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Failed to create payment");
        }
        
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Failed to setup payment",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    createPaymentIntent();
  }, [amount, description, toast]);
  
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
        <h3 className="text-xl font-semibold">Payment Required</h3>
        <p className="text-muted-foreground">
          You've used all your free listings. Pay a small fee to create another listing, or upgrade to premium.
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex justify-between">
            <span>{description}</span>
            <span>€{amount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm description={description} />
      </Elements>
      
      {onCancel && (
        <Button 
          variant="outline" 
          onClick={onCancel} 
          className="w-full"
        >
          Cancel
        </Button>
      )}
    </div>
  );
}