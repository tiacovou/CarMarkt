import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";

export default function SellYourCar() {
  const benefits = [
    "2 Free listings per month",
    "Reach thousands of local buyers",
    "Secure messaging"
  ];
  
  return (
    <section className="bg-[#121a2e] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-8 md:mb-0 md:w-1/2 md:pr-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Sell Your Car?</h2>
            <p className="text-xl mb-4">List your vehicle on CarMarkt and connect with thousands of potential buyers.</p>
            <ul className="space-y-2 mb-6">
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
          
          <div className="md:w-1/2">
            <img 
              src="/blue-car.jpg" 
              alt="Blue car for sale" 
              className="rounded-lg shadow-xl w-full" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
