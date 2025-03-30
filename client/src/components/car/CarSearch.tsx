import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import { CarSearch as CarSearchType } from "@shared/schema";

// Car brands for the dropdown
const carBrands = [
  { value: "any", label: "Any Make" },
  { value: "Toyota", label: "Toyota" },
  { value: "Honda", label: "Honda" },
  { value: "Ford", label: "Ford" },
  { value: "BMW", label: "BMW" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz" },
  { value: "Audi", label: "Audi" },
  { value: "Tesla", label: "Tesla" },
  { value: "Chevrolet", label: "Chevrolet" },
  { value: "Jeep", label: "Jeep" },
];

// Car models organized by make
const carModelsByMake: Record<string, Array<{ value: string, label: string }>> = {
  "any": [{ value: "any", label: "Any Model" }],
  "Toyota": [
    { value: "any", label: "Any Model" },
    { value: "Camry", label: "Camry" },
    { value: "Corolla", label: "Corolla" },
    { value: "RAV4", label: "RAV4" },
    { value: "Highlander", label: "Highlander" },
    { value: "Tacoma", label: "Tacoma" },
  ],
  "Honda": [
    { value: "any", label: "Any Model" },
    { value: "Civic", label: "Civic" },
    { value: "Accord", label: "Accord" },
    { value: "CR-V", label: "CR-V" },
    { value: "Pilot", label: "Pilot" },
    { value: "Odyssey", label: "Odyssey" },
  ],
  "Ford": [
    { value: "any", label: "Any Model" },
    { value: "F-150", label: "F-150" },
    { value: "Mustang", label: "Mustang" },
    { value: "Explorer", label: "Explorer" },
    { value: "Escape", label: "Escape" },
    { value: "Edge", label: "Edge" },
  ],
  "BMW": [
    { value: "any", label: "Any Model" },
    { value: "3 Series", label: "3 Series" },
    { value: "5 Series", label: "5 Series" },
    { value: "X3", label: "X3" },
    { value: "X5", label: "X5" },
    { value: "7 Series", label: "7 Series" },
  ],
  "Mercedes-Benz": [
    { value: "any", label: "Any Model" },
    { value: "C-Class", label: "C-Class" },
    { value: "E-Class", label: "E-Class" },
    { value: "S-Class", label: "S-Class" },
    { value: "GLC", label: "GLC" },
    { value: "GLE", label: "GLE" },
  ],
  "Audi": [
    { value: "any", label: "Any Model" },
    { value: "A3", label: "A3" },
    { value: "A4", label: "A4" },
    { value: "A6", label: "A6" },
    { value: "Q5", label: "Q5" },
    { value: "Q7", label: "Q7" },
  ],
  "Tesla": [
    { value: "any", label: "Any Model" },
    { value: "Model 3", label: "Model 3" },
    { value: "Model Y", label: "Model Y" },
    { value: "Model S", label: "Model S" },
    { value: "Model X", label: "Model X" },
    { value: "Cybertruck", label: "Cybertruck" },
  ],
  "Chevrolet": [
    { value: "any", label: "Any Model" },
    { value: "Silverado", label: "Silverado" },
    { value: "Equinox", label: "Equinox" },
    { value: "Tahoe", label: "Tahoe" },
    { value: "Malibu", label: "Malibu" },
    { value: "Camaro", label: "Camaro" },
  ],
  "Jeep": [
    { value: "any", label: "Any Model" },
    { value: "Wrangler", label: "Wrangler" },
    { value: "Grand Cherokee", label: "Grand Cherokee" },
    { value: "Cherokee", label: "Cherokee" },
    { value: "Compass", label: "Compass" },
    { value: "Gladiator", label: "Gladiator" },
  ]
};

// Price ranges for dropdown
const priceRanges = [
  { value: "any", label: "No Max Price" },
  { value: "10000", label: "$10,000" },
  { value: "20000", label: "$20,000" },
  { value: "30000", label: "$30,000" },
  { value: "40000", label: "$40,000" },
  { value: "50000", label: "$50,000" },
  { value: "75000", label: "$75,000" },
  { value: "100000", label: "$100,000" },
];

// Year ranges for dropdown
const yearRanges = [
  { value: "any", label: "Any Year" },
  { value: "2023", label: "2023" },
  { value: "2020", label: "2020" },
  { value: "2015", label: "2015" },
  { value: "2010", label: "2010" },
  { value: "2005", label: "2005" },
  { value: "2000", label: "2000" },
];

interface CarSearchProps {
  initialSearchParams?: URLSearchParams;
  onSearch?: (searchParams: CarSearchType) => void;
  compact?: boolean;
}

export default function CarSearch({ initialSearchParams, onSearch, compact = false }: CarSearchProps) {
  const [, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState<CarSearchType>({
    make: initialSearchParams?.get("make") || "",
    model: initialSearchParams?.get("model") || "",
    minYear: initialSearchParams?.get("minYear") ? parseInt(initialSearchParams.get("minYear")!) : undefined,
    maxPrice: initialSearchParams?.get("maxPrice") ? parseInt(initialSearchParams.get("maxPrice")!) : undefined,
  });
  
  // Get the current models based on selected make
  const currentModels = useMemo(() => {
    // If make is empty string, use the "any" models
    const makeKey = searchParams.make || "any";
    // If the make is not in our mapping, default to just the "Any Model" option
    return carModelsByMake[makeKey] || carModelsByMake["any"];
  }, [searchParams.make]);
  
  const handleChange = (key: keyof CarSearchType, value: string) => {
    if (key === "make") {
      // When make changes, reset model to empty string
      setSearchParams(prev => ({
        ...prev,
        make: value === "any" ? "" : value,
        model: "" // Reset model when make changes
      }));
    } else {
      setSearchParams(prev => ({
        ...prev,
        [key]: key === "minYear" || key === "maxPrice" 
          ? (value && value !== "any" ? parseInt(value) : undefined) 
          : (value === "any" ? "" : value)
      }));
    }
    console.log("Search params updated:", searchParams); // Debug
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Submitting search with params:", searchParams); // Debug
    
    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Build query string for URL
      const queryParams = new URLSearchParams();
      
      // Only add parameters that have meaningful values
      if (searchParams.make && searchParams.make !== "") {
        queryParams.set("make", searchParams.make);
      }
      
      if (searchParams.model && searchParams.model !== "") {
        queryParams.set("model", searchParams.model);
      }
      
      if (searchParams.minYear && searchParams.minYear > 0) {
        queryParams.set("minYear", searchParams.minYear.toString());
      }
      
      if (searchParams.maxPrice && searchParams.maxPrice > 0) {
        queryParams.set("maxPrice", searchParams.maxPrice.toString());
      }
      
      console.log("QueryParams string:", queryParams.toString()); // Debug
      setLocation(`/browse?${queryParams.toString()}`);
    }
  };
  
  return (
    <section className={`bg-white shadow-md ${compact ? 'py-3' : 'py-6'}`}>
      <div className="container mx-auto px-4 lg:px-6">
        {!compact && (
          <div className="mb-4">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold">Find Your Dream Car</h2>
            <p className="text-gray-600">Search from thousands of listings</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className={`grid grid-cols-1 ${compact ? 'md:grid-cols-3 lg:grid-cols-5 gap-3' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'}`}>
          {/* Make dropdown */}
          <div>
            <Label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</Label>
            <Select 
              value={searchParams.make} 
              onValueChange={(value) => handleChange("make", value)}
            >
              <SelectTrigger id="make" className="w-full">
                <SelectValue placeholder="Any Make" />
              </SelectTrigger>
              <SelectContent>
                {carBrands.map((brand) => (
                  <SelectItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Model dropdown */}
          <div>
            <Label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</Label>
            <Select 
              value={searchParams.model} 
              onValueChange={(value) => handleChange("model", value)}
            >
              <SelectTrigger id="model" className="w-full">
                <SelectValue placeholder="Any Model" />
              </SelectTrigger>
              <SelectContent>
                {currentModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Price Range */}
          <div>
            <Label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Max Price</Label>
            <Select 
              value={searchParams.maxPrice?.toString() || "any"} 
              onValueChange={(value) => handleChange("maxPrice", value)}
            >
              <SelectTrigger id="price" className="w-full">
                <SelectValue placeholder="No Max Price" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Year Range */}
          <div>
            <Label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Min Year</Label>
            <Select 
              value={searchParams.minYear?.toString() || "any"} 
              onValueChange={(value) => handleChange("minYear", value)}
            >
              <SelectTrigger id="year" className="w-full">
                <SelectValue placeholder="Any Year" />
              </SelectTrigger>
              <SelectContent>
                {yearRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Search Button */}
          <div className="flex items-end">
            <Button type="submit" className="w-full h-10">
              <Search className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">Search Cars</span>
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}