import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function FeaturedMakes() {
  const carMakes = [
    {
      name: "Toyota",
      image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      count: 48
    },
    {
      name: "Mercedes-Benz",
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      count: 36
    },
    {
      name: "BMW",
      image: "https://images.unsplash.com/photo-1556800572-1b8aeef2c54f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      count: 32
    },
    {
      name: "Audi",
      image: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      count: 29
    },
    {
      name: "Ford",
      image: "https://images.unsplash.com/photo-1551830820-330a71b99659?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      count: 42
    },
    {
      name: "Honda",
      image: "https://images.unsplash.com/photo-1629897048514-3dd7414efc9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      count: 38
    }
  ];
  
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 lg:mb-14">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Popular Car Makes</h2>
            <p className="text-gray-600 max-w-2xl text-lg">
              Browse through our most popular car brands with thousands of listings
            </p>
          </div>
          <Link href="/browse">
            <a className="text-primary hover:text-primary/90 font-medium flex items-center mt-3 sm:mt-0">
              View All Makes <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {carMakes.map((make, index) => (
            <Link key={index} href={`/browse?make=${make.name}`}>
              <a className="group block relative rounded-xl overflow-hidden h-48 shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20 z-10"></div>
                <img 
                  src={make.image} 
                  alt={`${make.name} cars`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-0 left-0 p-5 z-20 w-full">
                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{make.name}</h3>
                      <p className="text-gray-200">{make.count} listings</p>
                    </div>
                    <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}