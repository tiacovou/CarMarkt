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

// Car models organized by make - verified with current information
const carModelsByMake: Record<string, Array<{ value: string, label: string }>> = {
  "any": [{ value: "any", label: "Any Model" }],
  "Toyota": [
    { value: "any", label: "Any Model" },
    { value: "4Runner", label: "4Runner" },
    { value: "Avalon", label: "Avalon" },
    { value: "bZ4X", label: "bZ4X" },
    { value: "Camry", label: "Camry" },
    { value: "Corolla", label: "Corolla" },
    { value: "Corolla Cross", label: "Corolla Cross" },
    { value: "Corolla Hatchback", label: "Corolla Hatchback" },
    { value: "Crown", label: "Crown" },
    { value: "GR86", label: "GR86" },
    { value: "GR Corolla", label: "GR Corolla" },
    { value: "GR Supra", label: "GR Supra" },
    { value: "Highlander", label: "Highlander" },
    { value: "Prius", label: "Prius" },
    { value: "RAV4", label: "RAV4" },
    { value: "Sequoia", label: "Sequoia" },
    { value: "Sienna", label: "Sienna" },
    { value: "Tacoma", label: "Tacoma" },
    { value: "Tundra", label: "Tundra" },
    { value: "Venza", label: "Venza" }
  ],
  "Honda": [
    { value: "any", label: "Any Model" },
    { value: "Accord", label: "Accord" },
    { value: "Civic", label: "Civic" },
    { value: "Civic Type R", label: "Civic Type R" },
    { value: "CR-V", label: "CR-V" },
    { value: "CR-V Hybrid", label: "CR-V Hybrid" },
    { value: "HR-V", label: "HR-V" },
    { value: "Odyssey", label: "Odyssey" },
    { value: "Passport", label: "Passport" },
    { value: "Pilot", label: "Pilot" },
    { value: "Prologue", label: "Prologue" },
    { value: "Ridgeline", label: "Ridgeline" }
  ],
  "Ford": [
    { value: "any", label: "Any Model" },
    { value: "Bronco", label: "Bronco" },
    { value: "Bronco Sport", label: "Bronco Sport" },
    { value: "Edge", label: "Edge" },
    { value: "Escape", label: "Escape" },
    { value: "Expedition", label: "Expedition" },
    { value: "Explorer", label: "Explorer" },
    { value: "F-150", label: "F-150" },
    { value: "F-150 Lightning", label: "F-150 Lightning" },
    { value: "F-250", label: "F-250" },
    { value: "F-350", label: "F-350" },
    { value: "Maverick", label: "Maverick" },
    { value: "Mustang", label: "Mustang" },
    { value: "Mustang Mach-E", label: "Mustang Mach-E" },
    { value: "Ranger", label: "Ranger" },
    { value: "Transit", label: "Transit" }
  ],
  "BMW": [
    { value: "any", label: "Any Model" },
    { value: "2 Series", label: "2 Series" },
    { value: "3 Series", label: "3 Series" },
    { value: "4 Series", label: "4 Series" },
    { value: "5 Series", label: "5 Series" },
    { value: "7 Series", label: "7 Series" },
    { value: "8 Series", label: "8 Series" },
    { value: "i4", label: "i4" },
    { value: "i5", label: "i5" },
    { value: "i7", label: "i7" },
    { value: "iX", label: "iX" },
    { value: "M2", label: "M2" },
    { value: "M3", label: "M3" },
    { value: "M4", label: "M4" },
    { value: "M5", label: "M5" },
    { value: "M8", label: "M8" },
    { value: "X1", label: "X1" },
    { value: "X2", label: "X2" },
    { value: "X3", label: "X3" },
    { value: "X4", label: "X4" },
    { value: "X5", label: "X5" },
    { value: "X6", label: "X6" },
    { value: "X7", label: "X7" },
    { value: "XM", label: "XM" },
    { value: "Z4", label: "Z4" }
  ],
  "Mercedes-Benz": [
    { value: "any", label: "Any Model" },
    { value: "A-Class", label: "A-Class" },
    { value: "AMG GT", label: "AMG GT" },
    { value: "C-Class", label: "C-Class" },
    { value: "CLA", label: "CLA" },
    { value: "CLS", label: "CLS" },
    { value: "E-Class", label: "E-Class" },
    { value: "EQB", label: "EQB" },
    { value: "EQE", label: "EQE" },
    { value: "EQE SUV", label: "EQE SUV" },
    { value: "EQS", label: "EQS" },
    { value: "EQS SUV", label: "EQS SUV" },
    { value: "G-Class", label: "G-Class" },
    { value: "GLA", label: "GLA" },
    { value: "GLB", label: "GLB" },
    { value: "GLC", label: "GLC" },
    { value: "GLE", label: "GLE" },
    { value: "GLS", label: "GLS" },
    { value: "S-Class", label: "S-Class" },
    { value: "SL", label: "SL" }
  ],
  "Audi": [
    { value: "any", label: "Any Model" },
    { value: "A3", label: "A3" },
    { value: "A4", label: "A4" },
    { value: "A5", label: "A5" },
    { value: "A6", label: "A6" },
    { value: "A7", label: "A7" },
    { value: "A8", label: "A8" },
    { value: "e-tron", label: "e-tron" },
    { value: "e-tron GT", label: "e-tron GT" },
    { value: "Q3", label: "Q3" },
    { value: "Q4 e-tron", label: "Q4 e-tron" },
    { value: "Q5", label: "Q5" },
    { value: "Q7", label: "Q7" },
    { value: "Q8", label: "Q8" },
    { value: "Q8 e-tron", label: "Q8 e-tron" },
    { value: "R8", label: "R8" },
    { value: "RS3", label: "RS3" },
    { value: "RS5", label: "RS5" },
    { value: "RS6 Avant", label: "RS6 Avant" },
    { value: "RS7", label: "RS7" },
    { value: "S3", label: "S3" },
    { value: "S4", label: "S4" },
    { value: "S5", label: "S5" },
    { value: "S6", label: "S6" },
    { value: "S7", label: "S7" },
    { value: "S8", label: "S8" },
    { value: "TT", label: "TT" }
  ],
  "Tesla": [
    { value: "any", label: "Any Model" },
    { value: "Model 3", label: "Model 3" },
    { value: "Model S", label: "Model S" },
    { value: "Model X", label: "Model X" },
    { value: "Model Y", label: "Model Y" },
    { value: "Cybertruck", label: "Cybertruck" }
  ],
  "Chevrolet": [
    { value: "any", label: "Any Model" },
    { value: "Blazer", label: "Blazer" },
    { value: "Blazer EV", label: "Blazer EV" },
    { value: "Bolt EUV", label: "Bolt EUV" },
    { value: "Bolt EV", label: "Bolt EV" },
    { value: "Camaro", label: "Camaro" },
    { value: "Colorado", label: "Colorado" },
    { value: "Corvette", label: "Corvette" },
    { value: "Equinox", label: "Equinox" },
    { value: "Equinox EV", label: "Equinox EV" },
    { value: "Express", label: "Express" },
    { value: "Malibu", label: "Malibu" },
    { value: "Silverado 1500", label: "Silverado 1500" },
    { value: "Silverado 2500HD", label: "Silverado 2500HD" },
    { value: "Silverado 3500HD", label: "Silverado 3500HD" },
    { value: "Silverado EV", label: "Silverado EV" },
    { value: "Suburban", label: "Suburban" },
    { value: "Tahoe", label: "Tahoe" },
    { value: "Trailblazer", label: "Trailblazer" },
    { value: "Traverse", label: "Traverse" },
    { value: "Trax", label: "Trax" }
  ],
  "Jeep": [
    { value: "any", label: "Any Model" },
    { value: "Cherokee", label: "Cherokee" },
    { value: "Compass", label: "Compass" },
    { value: "Gladiator", label: "Gladiator" },
    { value: "Grand Cherokee", label: "Grand Cherokee" },
    { value: "Grand Cherokee 4xe", label: "Grand Cherokee 4xe" },
    { value: "Grand Cherokee L", label: "Grand Cherokee L" },
    { value: "Grand Wagoneer", label: "Grand Wagoneer" },
    { value: "Renegade", label: "Renegade" },
    { value: "Wagoneer", label: "Wagoneer" },
    { value: "Wrangler", label: "Wrangler" },
    { value: "Wrangler 4xe", label: "Wrangler 4xe" }
  ]
};

// Price ranges for dropdown
const priceRanges = [
  { value: "any", label: "No Max Price" },
  { value: "5000", label: "$5,000" },
  { value: "10000", label: "$10,000" },
  { value: "15000", label: "$15,000" },
  { value: "20000", label: "$20,000" },
  { value: "25000", label: "$25,000" },
  { value: "30000", label: "$30,000" },
  { value: "35000", label: "$35,000" },
  { value: "40000", label: "$40,000" },
  { value: "45000", label: "$45,000" },
  { value: "50000", label: "$50,000" },
  { value: "60000", label: "$60,000" },
  { value: "70000", label: "$70,000" },
  { value: "80000", label: "$80,000" },
  { value: "90000", label: "$90,000" },
  { value: "100000", label: "$100,000" },
  { value: "125000", label: "$125,000" },
  { value: "150000", label: "$150,000" },
  { value: "200000", label: "$200,000" },
];

// Year ranges for dropdown
const yearRanges = [
  { value: "any", label: "Any Year" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
  { value: "2019", label: "2019" },
  { value: "2018", label: "2018" },
  { value: "2017", label: "2017" },
  { value: "2016", label: "2016" },
  { value: "2015", label: "2015" },
  { value: "2014", label: "2014" },
  { value: "2013", label: "2013" },
  { value: "2012", label: "2012" },
  { value: "2011", label: "2011" },
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
    <section className={`bg-white shadow-lg rounded-lg ${compact ? 'py-3' : 'py-6'}`}>
      <div className="container mx-auto px-6 lg:px-8">
        {!compact && (
          <div className="mb-4">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold">Find Your Dream Car</h2>
            <p className="text-gray-600">Search from thousands of listings</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 lg:grid-cols-5 gap-4' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'}`}>
          {/* Make dropdown */}
          <div>
            <Label htmlFor="make" className="block text-sm font-semibold text-gray-800 mb-1.5">Make</Label>
            <Select 
              value={searchParams.make} 
              onValueChange={(value) => handleChange("make", value)}
            >
              <SelectTrigger id="make" className="w-full bg-white border-gray-300 h-11">
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
            <Label htmlFor="model" className="block text-sm font-semibold text-gray-800 mb-1.5">Model</Label>
            <Select 
              value={searchParams.model} 
              onValueChange={(value) => handleChange("model", value)}
            >
              <SelectTrigger id="model" className="w-full bg-white border-gray-300 h-11">
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
            <Label htmlFor="price" className="block text-sm font-semibold text-gray-800 mb-1.5">Max Price</Label>
            <Select 
              value={searchParams.maxPrice?.toString() || "any"} 
              onValueChange={(value) => handleChange("maxPrice", value)}
            >
              <SelectTrigger id="price" className="w-full bg-white border-gray-300 h-11">
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
            <Label htmlFor="year" className="block text-sm font-semibold text-gray-800 mb-1.5">Min Year</Label>
            <Select 
              value={searchParams.minYear?.toString() || "any"} 
              onValueChange={(value) => handleChange("minYear", value)}
            >
              <SelectTrigger id="year" className="w-full bg-white border-gray-300 h-11">
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
            <Button type="submit" className="w-full h-11 text-base font-medium bg-primary hover:bg-primary/90">
              <Search className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">Search Cars</span>
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}