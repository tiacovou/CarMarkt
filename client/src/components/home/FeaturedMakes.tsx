import { Link } from "wouter";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Car } from "@shared/schema";

// Default images for common car makes in Cyprus
const makeImages: Record<string, string> = {
  "Toyota": "https://images.unsplash.com/photo-1559416523-140ddc3d238c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Mercedes-Benz": "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "BMW": "https://images.unsplash.com/photo-1556800572-1b8aeef2c54f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Volkswagen": "https://images.unsplash.com/photo-1622199678703-b924d574e23d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Nissan": "https://images.unsplash.com/photo-1595955304716-5d26659c6be7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Honda": "https://images.unsplash.com/photo-1629897048514-3dd7414efc9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Hyundai": "https://images.unsplash.com/photo-1641750068478-a69d4689c880?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Mazda": "https://images.unsplash.com/photo-1586464367789-5033030e08f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Kia": "https://images.unsplash.com/photo-1552585140-bdeefd6b9d6a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Peugeot": "https://images.unsplash.com/photo-1608926452878-7614e6526cca?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Audi": "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
  "Renault": "https://images.unsplash.com/photo-1589187151053-5ec8818e661b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
};

// Default image if we don't have a specific one for the make - Cyprus coastal road with car
const defaultCarImage = "https://images.unsplash.com/photo-1556881261-e41e8db21ac6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80";

export default function FeaturedMakes() {
  // Fetch all cars to analyze available makes
  const { data: cars, isLoading } = useQuery<Car[]>({
    queryKey: ["/api/cars"],
  });
  
  // Process the car data to extract makes and their counts
  const processCarMakes = () => {
    if (!cars || cars.length === 0) return [];
    
    // Group cars by make and count them
    const makeCounts: Record<string, number> = {};
    cars.forEach(car => {
      if (car.make) {
        makeCounts[car.make] = (makeCounts[car.make] || 0) + 1;
      }
    });
    
    // Convert to array and sort by count (descending)
    const makes = Object.entries(makeCounts).map(([name, count]) => ({
      name,
      count,
      image: makeImages[name] || defaultCarImage
    }));
    
    // Sort by count and take top 6
    return makes.sort((a, b) => b.count - a.count).slice(0, 6);
  };
  
  const carMakes = processCarMakes();
  
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 lg:mb-14">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Popular Car Makes in Cyprus</h2>
            <p className="text-gray-600 max-w-2xl text-lg">
              Browse through the most popular car brands on the island
            </p>
          </div>
          <Link href="/browse">
            <a className="text-primary hover:text-primary/90 font-medium flex items-center mt-3 sm:mt-0">
              View All Makes <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : carMakes.length > 0 ? (
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
                        <p className="text-gray-200">{make.count} {make.count === 1 ? 'listing' : 'listings'}</p>
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
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">No car listings available yet.</p>
            <Link href="/sell">
              <a className="text-primary hover:text-primary/90 font-medium">
                Add your car listing
              </a>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}