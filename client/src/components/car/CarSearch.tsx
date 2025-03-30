import { useEffect, useState } from "react";
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
  { value: "toyota", label: "Toyota" },
  { value: "honda", label: "Honda" },
  { value: "ford", label: "Ford" },
  { value: "bmw", label: "BMW" },
  { value: "mercedes", label: "Mercedes-Benz" },
  { value: "audi", label: "Audi" },
  { value: "tesla", label: "Tesla" },
  { value: "chevrolet", label: "Chevrolet" },
  { value: "jeep", label: "Jeep" },
];

// Car models for the dropdown - could be expanded based on selected make
const carModels = [
  { value: "any", label: "Any Model" },
  { value: "camry", label: "Camry" },
  { value: "corolla", label: "Corolla" },
  { value: "civic", label: "Civic" },
  { value: "accord", label: "Accord" },
  { value: "model3", label: "Model 3" },
  { value: "modelY", label: "Model Y" },
  { value: "f150", label: "F-150" },
  { value: "mustang", label: "Mustang" },
  { value: "wrangler", label: "Wrangler" },
];

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
  
  const handleChange = (key: keyof CarSearchType, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: key === "minYear" || key === "maxPrice" 
        ? (value && value !== "any" ? parseInt(value) : undefined) 
        : (value === "any" ? "" : value)
    }));
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
                {carModels.map((model) => (
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
