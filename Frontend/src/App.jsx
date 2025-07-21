"use client"
import React, { useState, useEffect } from "react"
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Star,
  Heart,
  ChevronRight,
  Search,
  Smartphone,
  Laptop,
  Headphones,
  Gamepad2,
  Home,
  Apple,
  Milk,
  Fish,
  ChefHat,
  Coffee,
  User,
  Users,
  ShoppingBag,
  Watch,
  Briefcase,
  Zap,
  Shirt,
  MapPin,
  Truck,
  Shield,
  Award,
  Mic,
} from "lucide-react"
import VoiceAssistant from "./VoiceAssistant"
import Checkout from "./Checkout"

const App = () => {
  const [showCheckout, setShowCheckout] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [activeTab, setActiveTab] = useState("shop")
  // Navigation state
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [subCategories, setSubCategories] = useState([])
  const [selectedSubCategory, setSelectedSubCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [currentView, setCurrentView] = useState("categories")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: "Home", view: "categories" }])

  // API base URL
  const API_BASE_URL = "http://localhost:8000"

  useEffect(() => {
    fetchCategories()
  }, [])

  // Category icons mapping
  const categoryIcons = {
    Electronics: Zap,
    Food: Apple,
    "Clothing & Fashion": Shirt,
  }

  const subCategoryIcons = {
    Smartphones: Smartphone,
    "Laptops & Computers": Laptop,
    "Audio & Headphones": Headphones,
    Gaming: Gamepad2,
    "Smart Home": Home,
    "Fresh Produce": Apple,
    "Dairy & Eggs": Milk,
    "Meat & Seafood": Fish,
    "Pantry Staples": ChefHat,
    "Snacks & Beverages": Coffee,
    "Men's Clothing": User,
    "Women's Clothing": Users,
    "Shoes & Footwear": ShoppingBag,
    Accessories: Watch,
    "Bags & Luggage": Briefcase,
  }

  // API calls
  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`)
      const data = await response.json()
      if (response.ok) {
        setCategories(data.data || [])
      } else {
        setError(data.message || "Failed to fetch categories")
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      setError("Failed to connect to server")
      // Enhanced fallback data
      setCategories([
        {
          id: 1,
          name: "Electronics",
          description: "Latest tech gadgets and devices",
          itemCount: "50,000+ items",
        },
        {
          id: 2,
          name: "Food",
          description: "Fresh groceries and everyday essentials",
          itemCount: "100,000+ items",
        },
        {
          id: 3,
          name: "Clothing & Fashion",
          description: "Trendy apparel and accessories",
          itemCount: "75,000+ items",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubCategories = async (categoryId) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/all-subcategory/${categoryId}`)
      const data = await response.json()
      if (response.ok) {
        setSubCategories(data.data || [])
      } else {
        setError(data.message || "Failed to fetch subcategories")
        // Enhanced fallback mock data
        const mockSubCategories = {
          1: [
            { id: 1, name: "Smartphones", description: "Mobile phones and accessories", itemCount: "5,000+ items" },
            {
              id: 2,
              name: "Laptops & Computers",
              description: "Portable and desktop computing devices",
              itemCount: "3,000+ items",
            },
            {
              id: 3,
              name: "Audio & Headphones",
              description: "Sound devices and audio equipment",
              itemCount: "2,500+ items",
            },
            { id: 4, name: "Gaming", description: "Gaming consoles and accessories", itemCount: "4,000+ items" },
            { id: 5, name: "Smart Home", description: "Connected home automation devices", itemCount: "1,800+ items" },
          ],
          2: [
            { id: 6, name: "Fresh Produce", description: "Fresh fruits and vegetables", itemCount: "2,000+ items" },
            { id: 7, name: "Dairy & Eggs", description: "Milk products and fresh eggs", itemCount: "800+ items" },
            {
              id: 8,
              name: "Meat & Seafood",
              description: "Fresh and frozen protein sources",
              itemCount: "1,200+ items",
            },
            {
              id: 9,
              name: "Pantry Staples",
              description: "Essential cooking ingredients and canned goods",
              itemCount: "5,000+ items",
            },
            {
              id: 10,
              name: "Snacks & Beverages",
              description: "Ready-to-eat snacks and drinks",
              itemCount: "3,500+ items",
            },
          ],
          3: [
            { id: 11, name: "Men's Clothing", description: "Fashionable clothing for men", itemCount: "8,000+ items" },
            { id: 12, name: "Women's Clothing", description: "Trendy apparel for women", itemCount: "12,000+ items" },
            {
              id: 13,
              name: "Shoes & Footwear",
              description: "Comfortable and stylish footwear",
              itemCount: "4,500+ items",
            },
            { id: 14, name: "Accessories", description: "Fashion accessories and jewelry", itemCount: "3,200+ items" },
            {
              id: 15,
              name: "Bags & Luggage",
              description: "Handbags, backpacks, and travel gear",
              itemCount: "2,800+ items",
            },
          ],
        }
        setSubCategories(mockSubCategories[categoryId] || [])
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error)
      setError("Failed to connect to server")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProductsBySubCategory = async (subCategoryId) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/api/sub-category/${subCategoryId}/products`)
      const data = await response.json()
      if (response.ok) {
        setProducts(data.data || [])
      } else {
        setError(data.message || "Failed to fetch products")
        // Enhanced fallback mock data
        const mockProducts = [
          {
            id: 1,
            name: "Samsung Galaxy S24 Ultra",
            price: 1199.99,
            originalPrice: 1299.99,
            image: "/placeholder.svg?height=300&width=300",
            rating: 4.5,
            reviews: 1250,
            description: "Latest flagship smartphone with AI features",
            isBestSeller: true,
            discount: 8,
          },
          {
            id: 2,
            name: "Apple iPhone 15 Pro",
            price: 999.99,
            originalPrice: 1099.99,
            image: "/placeholder.svg?height=300&width=300",
            rating: 4.8,
            reviews: 3400,
            description: "Premium Apple smartphone with titanium design",
            isBestSeller: false,
            discount: 9,
          },
          {
            id: 3,
            name: "Google Pixel 8 Pro",
            price: 899.99,
            originalPrice: 999.99,
            image: "/placeholder.svg?height=300&width=300",
            rating: 4.3,
            reviews: 890,
            description: "Google's flagship phone with advanced AI photography",
            isBestSeller: false,
            discount: 10,
          },
          {
            id: 4,
            name: "OnePlus 12",
            price: 799.99,
            originalPrice: 899.99,
            image: "/placeholder.svg?height=300&width=300",
            rating: 4.7,
            reviews: 2100,
            description: "Fast and affordable flagship with premium features",
            isBestSeller: true,
            discount: 11,
          },
        ]
        setProducts(mockProducts)
      }
    } catch (error) {
      console.error("Error fetching products:", error)
      setError("Failed to connect to server")
    } finally {
      setIsLoading(false)
    }
  }

  // Navigation handlers
  const handleCategoryClick = async (category) => {
    setSelectedCategory(category)
    setCurrentView("subcategories")
    setBreadcrumbs([
      { name: "Home", view: "categories" },
      { name: category.name, view: "subcategories", categoryId: category.id },
    ])
    await fetchSubCategories(category.id)
  }

  const handleSubCategoryClick = async (subCategory) => {
    setSelectedSubCategory(subCategory)
    setCurrentView("products")
    setBreadcrumbs([
      { name: "Home", view: "categories" },
      { name: selectedCategory.name, view: "subcategories", categoryId: selectedCategory.id },
      { name: subCategory.name, view: "products", subCategoryId: subCategory.id },
    ])
    await fetchProductsBySubCategory(subCategory.id)
  }

  const handleBreadcrumbClick = (breadcrumb) => {
    if (breadcrumb.view === "categories") {
      setCurrentView("categories")
      setBreadcrumbs([{ name: "Home", view: "categories" }])
      setSelectedCategory(null)
      setSelectedSubCategory(null)
    } else if (breadcrumb.view === "subcategories") {
      setCurrentView("subcategories")
      setBreadcrumbs(breadcrumbs.slice(0, 2))
      setSelectedSubCategory(null)
    }
  }

  const addToCart = (product) => {
    const existingItem = cartItems.find((item) => item.id === product.id)
    if (existingItem) {
      setCartItems(cartItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter((item) => item.id !== id))
    } else {
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalSavings = () => {
    return cartItems.reduce((total, item) => {
      const savings = (item.originalPrice || item.price) - item.price
      return total + savings * item.quantity
    }, 0)
  }

  // Component renders
  const CategoryCard = ({ category }) => {
    const IconComponent = categoryIcons[category.name] || Zap
    return (
      <div
        className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        onClick={() => handleCategoryClick(category)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
          {category.name}
        </h3>
        <p className="text-gray-600 mb-3">{category.description}</p>
        <p className="text-sm text-blue-600 font-medium">{category.itemCount}</p>
      </div>
    )
  }

  const SubCategoryCard = ({ subCategory }) => {
    const IconComponent = subCategoryIcons[subCategory.name] || Zap
    return (
      <div
        className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl hover:border-yellow-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
        onClick={() => handleSubCategoryClick(subCategory)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg group-hover:from-yellow-500 group-hover:to-yellow-600 transition-all duration-300">
            <IconComponent className="w-7 h-7 text-white" />
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-yellow-600 transition-colors" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors">
          {subCategory.name}
        </h3>
        <p className="text-gray-600 mb-3 text-sm">{subCategory.description}</p>
        <p className="text-sm text-yellow-600 font-medium">{subCategory.itemCount}</p>
      </div>
    )
  }

  const ProductCard = ({ product }) => (
    <div className="group bg-white rounded-xl border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={product.image || "/placeholder.svg?height=250&width=250"}
          alt={product.name}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors">
          <Heart className="w-4 h-4 text-gray-600 hover:text-red-500 transition-colors" />
        </button>
        {product.isBestSeller && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-400 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <Award className="w-3 h-3" />
            Best Seller
          </div>
        )}
        {product.discount && (
          <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold">
            {product.discount}% OFF
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        {product.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"
                }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-2">{product.rating}</span>
            <span className="text-sm text-gray-500 ml-2">({product.reviews} reviews)</span>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">${product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => addToCart(product)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  )

  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 mb-8 bg-white rounded-lg p-4 shadow-sm">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => handleBreadcrumbClick(breadcrumb)}
            className={`text-sm font-medium transition-colors ${
              index === breadcrumbs.length - 1 ? "text-gray-800" : "text-blue-600 hover:text-blue-800"
            }`}
          >
            {breadcrumb.name}
          </button>
          {index < breadcrumbs.length - 1 && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </React.Fragment>
      ))}
    </div>
  )

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-20">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
      </div>
    </div>
  )

  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-red-100 rounded-full">
          <X className="w-5 h-5 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-red-800">Something went wrong</h3>
      </div>
      <p className="text-red-700 mb-4">{error}</p>
      <button
        onClick={() => {
          setError(null)
          if (currentView === "categories") fetchCategories()
          else if (currentView === "subcategories") fetchSubCategories(selectedCategory.id)
          else if (currentView === "products") fetchProductsBySubCategory(selectedSubCategory.id)
        }}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )

  if (showCheckout) {
    return <Checkout cartItems={cartItems} onBack={() => setShowCheckout(false)} getTotalPrice={getTotalPrice} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Enhanced Header */}
      <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between py-2 px-4 text-sm border-b border-blue-500/30">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Store locator</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span>Free shipping on orders $35+</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span>Sign in</span>
              <span>|</span>
              <span>Create account</span>
            </div>
          </div>
          {/* Main header */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-black text-blue-800">W</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black">Walmart</h1>
                    <p className="text-yellow-300 text-sm font-medium">Save Money. Live Better.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="relative p-3 bg-blue-700/50 rounded-full hover:bg-blue-700 transition-colors">
                  <ShoppingCart className="w-6 h-6" />
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-blue-800 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </button>
              </div>
            </div>
            {/* Enhanced Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search everything at Walmart online and in store"
                className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-yellow-400/50 text-lg shadow-lg"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 text-blue-800 px-6 py-2 rounded-full font-bold hover:bg-yellow-500 transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Cart Summary */}
        {cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Your Cart ({getTotalItems()} items)</h2>
                  {getTotalSavings() > 0 && (
                    <p className="text-green-600 font-medium">You're saving ${getTotalSavings().toFixed(2)}!</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Protected checkout</span>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={item.image || "/placeholder.svg?height=80&width=80"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-blue-600">${item.price}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-sm text-gray-500 line-through">${item.originalPrice}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => updateQuantity(item.id, 0)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div className="text-right">
                  {getTotalSavings() > 0 && (
                    <p className="text-green-600 font-medium mb-1">Total Savings: ${getTotalSavings().toFixed(2)}</p>
                  )}
                  <p className="text-3xl font-bold text-gray-800">Total: ${getTotalPrice().toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-800 px-8 py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                >
                  Checkout Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content with Tabs */}
        <div className="w-full">
          <div className="flex bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
            <button
              onClick={() => setActiveTab("shop")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "shop" ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Products
            </button>
            <button
              onClick={() => setActiveTab("voice")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === "voice" ? "bg-blue-500 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Mic className="w-4 h-4" />
              Voice Assistant
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">New</span>
            </button>
          </div>

          {activeTab === "shop" && (
            <div className="space-y-6">
              {/* Breadcrumbs */}
              <Breadcrumbs />
              {/* Error Message */}
              {error && <ErrorMessage />}
              {/* Loading Spinner */}
              {isLoading && <LoadingSpinner />}
              {/* Categories View */}
              {!isLoading && currentView === "categories" && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">Shop by Category</h2>
                    <p className="text-xl text-gray-600">Discover amazing deals across all departments</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((category) => (
                      <CategoryCard key={category.id} category={category} />
                    ))}
                  </div>
                </div>
              )}
              {/* Subcategories View */}
              {!isLoading && currentView === "subcategories" && (
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">{selectedCategory?.name}</h2>
                    <p className="text-xl text-gray-600">Choose from our wide selection</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {subCategories.map((subCategory) => (
                      <SubCategoryCard key={subCategory.id} subCategory={subCategory} />
                    ))}
                  </div>
                </div>
              )}
              {/* Products View */}
              {!isLoading && currentView === "products" && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedSubCategory?.name}</h2>
                      <p className="text-gray-600">{products.length} products found</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>Sort by: Featured</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Customer Rating</option>
                        <option>Best Sellers</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "voice" && (
            <VoiceAssistant cartItems={cartItems} onAddToCart={addToCart} apiBaseUrl={API_BASE_URL} />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
