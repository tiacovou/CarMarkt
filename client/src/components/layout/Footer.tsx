import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Car, Facebook, Twitter, Instagram, Youtube, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white text-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold">CarMarkt</span>
              <Car className="h-5 w-5" />
            </div>
            <p className="text-gray-600 mb-4">
              The trusted marketplace for buying and selling cars. Connect with buyers and sellers in your area.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-primary transition">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/browse">
                  <a className="text-gray-600 hover:text-primary transition">Browse Cars</a>
                </Link>
              </li>
              <li>
                <Link href="/sell">
                  <a className="text-gray-600 hover:text-primary transition">Sell Your Car</a>
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Car Values</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Dealer Resources</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Car Reviews</a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Contact Us</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">FAQ</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Safety Tips</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-primary transition">Terms of Service</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-gray-600 mb-4">
              Stay updated with the latest listings and automotive news.
            </p>
            <div className="flex">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white text-gray-800"
              />
              <Button type="submit" className="rounded-l-none">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} CarMarkt. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
