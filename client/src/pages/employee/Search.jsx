import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { employeeAPI } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
// Removed WebSocket import to fix connection issues
import {
  ArrowLeft,
  Search as SearchIcon,
  Plus,
  Minus,
  MapPin,
  Clock,
  ShoppingCart,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Search = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchResults, setSearchResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const {
    addItem,
    updateQuantity,
    getItemCount,
    items,
    getTotal,
    getTotalQuantity,
    cafeName,
  } = useCartStore();

  useEffect(() => {
    loadCategories();
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, []);

  // Add real-time search as user types
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // Debounce search by 500ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await employeeAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await employeeAPI.searchFoodItems(
        query,
        selectedCategory,
      );
      setSearchResults(response.data);
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search food items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleAddToCart = (menuItem, cafe) => {
    addItem(
      {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
      },
      cafe.id,
      cafe.name,
    );

    toast({
      title: "Added to Cart",
      description: `${menuItem.name} has been added to your cart.`,
    });
  };

  // Removed WebSocket functionality to fix connection issues

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Unknown";
  };

  return (
    <div className="min-h-screen bg-white employee-theme">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/employee" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Search Food</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Search Form */}
        <Card className="mb-6 bg-white">
          <CardContent className="p-4 bg-white">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search for food items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mobile-touch-target"
                  />
                </div>
                <Button
                  type="submit"
                  className="search-button bg-gray-800 hover:bg-gray-700 text-white"
                  disabled={loading}
                >
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Show search results count */}
              {searchQuery && (
                <div className="text-sm text-gray-600">
                  {loading
                    ? "Searching..."
                    : `Found ${searchResults.length} results`}
                </div>
              )}

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === null
                      ? "bg-employee-primary text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedCategory === category.id
                        ? "bg-employee-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Cart Summary */}
        {items.length > 0 && (
          <Card className="mb-6 bg-white border-employee-primary/20">
            <CardContent className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-employee-primary" />
                  <span className="font-semibold text-gray-800">
                    {getTotalQuantity()} items from {cafeName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-employee-primary">
                    {formatCurrency(getTotal())}
                  </span>
                  <Link to="/employee/cart">
                    <Button
                      className="dark-gray-button bg-gray-800 hover:bg-gray-700 text-white"
                      size="sm"
                    >
                      View Cart
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-employee-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Found {searchResults.length} result(s) for "{searchQuery}"
            </h2>
            {searchResults.map((result) => (
              <Card
                key={`${result.id}-${result.cafe?.id || "unknown"}`}
                className="food-card food-card-employee"
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-800">
                          {result.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {result.category_name || "Unknown Category"}
                        </Badge>
                        {/* {result.is_available && result.available_quantity > 0 && result.available_quantity <= 5 && (
                          <Badge variant="outline" className="text-xs border-employee-accent text-employee-accent">
                            Only {result.available_quantity} left
                          </Badge>
                        )}
                        {(!result.is_available || result.available_quantity === 0) && (
                          <Badge variant="destructive" className="text-xs">Unavailable</Badge>
                        )} */}
                      </div>

                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                        {result.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{result.cafe_name || "Unknown Cafe"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{result.preparation_time} min</span>
                        </div>
                        <span>Stock: {result.available_quantity}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-employee-primary">
                          {formatCurrency(result.price)}
                        </span>

                        <div className="flex gap-2">
                          {result.cafe_id && (
                            <Link to={`/employee/cafes/${result.cafe_id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                Visit Cafe
                              </Button>
                            </Link>
                          )}
                          <Button
                            className="add-to-cart-button bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
                            size="sm"
                            onClick={() =>
                              handleAddToCart(result, {
                                id: result.cafe_id,
                                name: result.cafe_name,
                              })
                            }
                            disabled={result.available_quantity <= 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery ? (
          <Card className="text-center p-8">
            <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No results found
            </h3>
            <p className="text-gray-600">
              No food items found for "{searchQuery}". Try different keywords or
              browse cafes directly.
            </p>
            <Link to="/employee/cafes" className="mt-4 inline-block">
              <Button className="bg-gray-700 hover:bg-gray-800 text-white">
                Browse Cafes
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="text-center p-8">
            <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Search for Food
            </h3>
            <p className="text-gray-600">
              Enter keywords to find your favorite food items across all cafes.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Search;
