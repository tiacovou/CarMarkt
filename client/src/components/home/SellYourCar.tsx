import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";

export default function SellYourCar() {
  const benefits = [
    "Free listings with premium options available",
    "Reach thousands of local buyers",
    "Secure messaging and transaction process"
  ];
  
  return (
    <section className="bg-primary text-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Sell Your Car?</h2>
            <p className="text-xl mb-6">List your vehicle on CarTrader and connect with thousands of potential buyers.</p>
            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center">
                  <Check className="mr-3 h-5 w-5 text-green-300" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <Link href="/sell">
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
                Create Your Listing
              </Button>
            </Link>
          </div>
          
          <div className="md:w-2/5">
            <img 
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" 
              alt="Person selling a car" 
              className="rounded-lg shadow-xl" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
