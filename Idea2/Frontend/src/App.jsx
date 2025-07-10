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
  ShoppingBasket,
  Shirt,
} from "lucide-react"
import Checkout from "./page/Checkout"
import BuyTogetherComponent from "./page/BuyTogether"

const App = () => {
  const [showCheckout, setShowCheckout] = useState(false)
  const [showBuyTogether, setShowBuyTogether] = useState(false)
  const [cartItems, setCartItems] = useState([])

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

  // API base URL - update this to match your server
  const API_BASE_URL = "http://localhost:8000"

  useEffect(() => {
    fetchCategories()
  }, [])

  // Category and subcategory icons mapping
  const categoryIcons = {
    1: Zap, // Electronics
    2: Apple, // Food
    3: Shirt, // Clothing & Fashion
  }

  const subCategoryIcons = {
    // Electronics subcategories
    1: Smartphone, // Smartphones
    2: Laptop, // Laptops & Computers
    3: Headphones, // Audio & Headphones
    4: Gamepad2, // Gaming
    5: Home, // Smart Home
    // Food subcategories
    6: Apple, // Fresh Produce
    7: Milk, // Dairy & Eggs
    8: Fish, // Meat & Seafood
    9: ChefHat, // Pantry Staples
    10: Coffee, // Snacks & Beverages
    // Clothing subcategories
    11: User, // Men's Clothing
    12: Users, // Women's Clothing
    13: ShoppingBag, // Shoes & Footwear
    14: Watch, // Accessories
    15: Briefcase, // Bags & Luggage
  }

  // Mock data with the structure you provided
  const mockCategories = [
    {
      id: 1,
      name: "Electronics",
      description: "Latest technology and electronic devices",
      icon: "Zap",
    },
    {
      id: 2,
      name: "Food",
      description: "Fresh groceries and food items",
      icon: "Apple",
    },
    {
      id: 3,
      name: "Clothing & Fashion",
      description: "Trendy clothing and fashion accessories",
      icon: "Shirt",
    },
  ]

  const mockSubCategories = {
    1: [
      // Electronics
      { id: 1, name: "Smartphones", description: "Mobile phones and accessories", icon: "Smartphone" },
      { id: 2, name: "Laptops & Computers", description: "Portable and desktop computing devices", icon: "Laptop" },
      { id: 3, name: "Audio & Headphones", description: "Sound devices and audio equipment", icon: "Headphones" },
      { id: 4, name: "Gaming", description: "Gaming consoles and accessories", icon: "Gamepad2" },
      { id: 5, name: "Smart Home", description: "Connected home automation devices", icon: "Home" },
    ],
    2: [
      // Food
      { id: 6, name: "Fresh Produce", description: "Fresh fruits and vegetables", icon: "Apple" },
      { id: 7, name: "Dairy & Eggs", description: "Milk products and fresh eggs", icon: "Milk" },
      { id: 8, name: "Meat & Seafood", description: "Fresh and frozen protein sources", icon: "Fish" },
      { id: 9, name: "Pantry Staples", description: "Essential cooking ingredients and canned goods", icon: "ChefHat" },
      { id: 10, name: "Snacks & Beverages", description: "Ready-to-eat snacks and drinks", icon: "Coffee" },
    ],
    3: [
      // Clothing & Fashion
      { id: 11, name: "Men's Clothing", description: "Fashionable clothing for men", icon: "User" },
      { id: 12, name: "Women's Clothing", description: "Trendy apparel for women", icon: "Users" },
      { id: 13, name: "Shoes & Footwear", description: "Comfortable and stylish footwear", icon: "ShoppingBag" },
      { id: 14, name: "Accessories", description: "Fashion accessories and jewelry", icon: "Watch" },
      { id: 15, name: "Bags & Luggage", description: "Handbags, backpacks, and travel gear", icon: "Briefcase" },
    ],
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
      // Fallback to mock data
      setCategories(mockCategories)
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
        setSubCategories(mockSubCategories[categoryId] || [])
      }
    } catch (error) {
      console.error("Error fetching subcategories:", error)
      setError("Failed to connect to server")
      setSubCategories(mockSubCategories[categoryId] || [])
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
        // Fallback mock products
        const mockProducts = [
          {
            id: 1,
            name: "Samsung Galaxy S24 Ultra",
            price: 1199.99,
            image: "/placeholder.svg?height=200&width=200",
            rating: 4.5,
            reviews: 1250,
            description: "Latest flagship smartphone with advanced AI features",
          },
          {
            id: 2,
            name: "Apple iPhone 15 Pro",
            price: 999.99,
            image: "/placeholder.svg?height=200&width=200",
            rating: 4.8,
            reviews: 3400,
            description: "Premium Apple smartphone with titanium design",
          },
          {
            id: 3,
            name: "Google Pixel 8 Pro",
            price: 899.99,
            image: "/placeholder.svg?height=200&width=200",
            rating: 4.3,
            reviews: 890,
            description: "Google's flagship phone with advanced photography",
          },
          {
            id: 4,
            name: "OnePlus 12",
            price: 799.99,
            image: "/placeholder.svg?height=200&width=200",
            rating: 4.7,
            reviews: 2100,
            description: "Fast and affordable flagship with premium features",
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

  // Component renders
  const CategoryCard = ({ category }) => {
    const IconComponent = categoryIcons[category.id] || ShoppingBasket
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-blue-300"
        onClick={() => handleCategoryClick(category)}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">{category.name}</h3>
          <p className="text-gray-600 mb-4 leading-relaxed">{category.description}</p>
          <div className="flex items-center text-blue-600 font-semibold">
            <span>Shop Now</span>
            <ChevronRight className="w-5 h-5 ml-1" />
          </div>
        </div>
      </div>
    )
  }

  const SubCategoryCard = ({ subCategory }) => {
    const IconComponent = subCategoryIcons[subCategory.id] || ShoppingBasket
    return (
      <div
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:border-yellow-300"
        onClick={() => handleSubCategoryClick(subCategory)}
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{subCategory.name}</h3>
            <p className="text-gray-600 mb-3 leading-relaxed">{subCategory.description}</p>
            <div className="flex items-center text-blue-600 font-semibold">
              <span className="text-sm">Explore</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={product.image || "/placeholder.svg?height=250&width=250"}
          alt={product.name}
          className="w-full h-56 object-cover"
        />
        <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors">
          <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
        </button>
        <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          Best Seller
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 text-lg">{product.name}</h3>
        {product.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(product.rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-2">{product.rating}</span>
            <span className="text-sm text-gray-500 ml-2">({product.reviews} reviews)</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-blue-600">${product.price}</span>
            <div className="text-xs text-gray-500">Free shipping</div>
          </div>
          <button
            onClick={() => addToCart(product)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-6 py-3 rounded-full hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 flex items-center gap-2 font-bold shadow-lg transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
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
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  )

  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
      <p className="text-red-800 font-medium">{error}</p>
      <button
        onClick={() => {
          setError(null)
          if (currentView === "categories") fetchCategories()
          else if (currentView === "subcategories") fetchSubCategories(selectedCategory.id)
          else if (currentView === "products") fetchProductsBySubCategory(selectedSubCategory.id)
        }}
        className="mt-3 text-sm text-red-600 hover:text-red-800 underline font-medium"
      >
        Try again
      </button>
    </div>
  )

  if (showCheckout) {
    return <Checkout cartItems={cartItems} onBack={() => setShowCheckout(false)} getTotalPrice={getTotalPrice} />
  }

  if (showBuyTogether) {
    return (
      <BuyTogetherComponent
        cartItems={cartItems}
        onBack={() => setShowBuyTogether(false)}
        getTotalPrice={getTotalPrice()}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-blue-800 font-black text-xl">W</span>
              </div>
              <h1 className="text-3xl font-black">Walmart</h1>
              <span className="text-yellow-300 text-sm font-medium">Save Money. Live Better.</span>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-3 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors shadow-lg">
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-blue-800 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search everything at Walmart online and in store"
              className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-yellow-300 shadow-lg text-lg"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Cart Summary */}
        {cartItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
              Shopping Cart ({getTotalItems()} items)
            </h2>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-6 p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                >
                  <img
                    src={item.image || "/placeholder.svg?height=80&width=80"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                    <p className="text-2xl font-bold text-blue-600">${item.price}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-100 rounded-full p-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 bg-white rounded-full hover:bg-gray-50 shadow-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 bg-white rounded-full hover:bg-gray-50 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => updateQuantity(item.id, 0)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-3xl font-bold text-gray-800">Total: ${getTotalPrice().toFixed(2)}</span>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-10 py-4 rounded-full font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    Checkout
                  </button>
                  <button
                    onClick={() => setShowBuyTogether(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-10 py-4 rounded-full font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg transform hover:scale-105"
                  >
                    Buy Together
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <p className="text-xl text-gray-600">Discover amazing products across all categories</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subCategories.map((subCategory) => (
                <SubCategoryCard key={subCategory.id} subCategory={subCategory} />
              ))}
            </div>
          </div>
        )}

        {/* Products View */}
        {!isLoading && currentView === "products" && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">{selectedSubCategory?.name}</h2>
              <p className="text-xl text-gray-600">Quality products at unbeatable prices</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
