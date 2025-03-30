import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Hero() {
  return (
    <section className="relative bg-gray-900 text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1583121274602-3e2820c69888?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80" 
          alt="Car on the road" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="container mx-auto px-4 lg:px-6 py-16 md:py-24 lg:py-36 xl:py-40 relative z-20">
        <div className="max-w-lg md:max-w-2xl lg:max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">Find Your Perfect Car</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-xl lg:max-w-2xl opacity-90">Buy and sell vehicles with confidence on the most trusted car marketplace</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/browse">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white text-base md:text-lg px-8 py-6 h-auto">
                Browse Cars
              </Button>
            </Link>
            <Link href="/sell">
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100 text-base md:text-lg px-8 py-6 h-auto">
                Sell Your Car
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
