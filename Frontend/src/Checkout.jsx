"use client"

import { useState } from "react"
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  User,
  ShoppingBag,
  Bot,
  CheckCircle,
  Star,
  Plus,
  Heart,
  Eye,
  Truck,
  Store,
  Clock,
  Gift,
  Zap,
  Shield,
  Tag,
} from "lucide-react"

const Checkout = ({ cartItems = [], onBack, getTotalPrice }) => {
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [llmRecommendations, setLlmRecommendations] = useState("")
  const [suggestedProducts, setSuggestedProducts] = useState([])
  const [totalProductsFound, setTotalProductsFound] = useState(0)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [deliveryOption, setDeliveryOption] = useState("delivery")

  // API base URL
  const API_BASE_URL = "http://localhost:8000"

  // Mock form data
  const [formData, setFormData] = useState({
    email: "customer@example.com",
    firstName: "John",
    lastName: "Doe",
    address: "123 Main St",
    city: "New York",
    zipCode: "10001",
    cardNumber: "**** **** **** 1234",
    expiryDate: "12/25",
    cvv: "***",
  })

  // Walmart Spark Icon Component
  const WalmartSpark = ({ className = "w-6 h-6" }) => (
    <div className={`${className} relative`}>
      <Zap className="w-full h-full text-yellow-400 fill-current" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
      </div>
    </div>
  )

  // Enhanced function to format LLM recommendations with Walmart theming
  const formatLLMRecommendations = (text) => {
    if (!text) return null

    const sections = text.split(/\n\s*\n/).filter((section) => section.trim())
    const formattedElements = []

    sections.forEach((section, sectionIndex) => {
      const lines = section.split("\n").filter((line) => line.trim())

      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim()
        if (!trimmedLine) return

        // Greeting or opening line
        if (
          trimmedLine.toLowerCase().includes("hey there") ||
          trimmedLine.toLowerCase().includes("hello") ||
          (sectionIndex === 0 && lineIndex === 0 && !trimmedLine.includes("*") && !trimmedLine.includes("•"))
        ) {
          formattedElements.push(
            <div key={`greeting-${sectionIndex}-${lineIndex}`} className="mb-6">
              <p className="text-lg text-gray-800 font-medium leading-relaxed">{trimmedLine}</p>
            </div>,
          )
        }
        // Main section headers
        else if (
          (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) ||
          (trimmedLine.endsWith(":") && trimmedLine.length < 80 && !trimmedLine.includes("*"))
        ) {
          const headerText = trimmedLine.replace(/\*\*/g, "").replace(/:$/, "")
          formattedElements.push(
            <div key={`header-${sectionIndex}-${lineIndex}`} className="mt-8 mb-4 first:mt-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <WalmartSpark className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {headerText}
                </h3>
              </div>
            </div>,
          )
        }
        // Sub-section headers
        else if (trimmedLine.startsWith("* **") && trimmedLine.includes(":**")) {
          const subHeaderText = trimmedLine.replace(/^\* \*\*/, "").replace(/:\*\*$/, "")
          formattedElements.push(
            <div key={`subheader-${sectionIndex}-${lineIndex}`} className="mt-6 mb-3">
              <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                {subHeaderText}
              </h4>
            </div>,
          )
        }
        // Bullet points
        else if (trimmedLine.startsWith("* ") || trimmedLine.startsWith("• ") || trimmedLine.startsWith("- ")) {
          const content = trimmedLine
            .replace(/^[*•-]\s*/, "")
            .replace(/^\*\*/, "")
            .replace(/\*\*$/, "")
          formattedElements.push(
            <div key={`bullet-${sectionIndex}-${lineIndex}`} className="flex items-start gap-3 mb-3 ml-4">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2.5 flex-shrink-0"></div>
              <p className="text-gray-700 leading-relaxed text-[15px]">{content}</p>
            </div>,
          )
        }
        // Numbered lists
        else if (/^\d+\./.test(trimmedLine)) {
          const content = trimmedLine.replace(/^\d+\.\s*/, "")
          const number = trimmedLine.match(/^(\d+)\./)[1]
          formattedElements.push(
            <div key={`numbered-${sectionIndex}-${lineIndex}`} className="flex items-start gap-3 mb-3 ml-4">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                {number}
              </div>
              <p className="text-gray-700 leading-relaxed text-[15px]">{content}</p>
            </div>,
          )
        }
        // Regular paragraphs
        else {
          formattedElements.push(
            <p
              key={`paragraph-${sectionIndex}-${lineIndex}`}
              className="text-gray-700 leading-relaxed mb-4 text-[15px]"
            >
              {trimmedLine}
            </p>,
          )
        }
      })
    })

    return formattedElements
  }

  // Function to render star rating
  const renderStarRating = (rating) => {
    if (!rating) return null
    const stars = []
    const numericRating = Number.parseFloat(rating)

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} className={`w-4 h-4 ${i <= numericRating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />,
      )
    }

    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">({numericRating})</span>
      </div>
    )
  }

  // Function to format price with savings
  const formatPrice = (price, originalPrice) => {
    if (!price) return "Price not available"
    const numericPrice = typeof price === "string" ? Number.parseFloat(price.replace(/[$,]/g, "")) : price

    if (originalPrice && originalPrice > numericPrice) {
      const savings = originalPrice - numericPrice
      const savingsPercent = Math.round((savings / originalPrice) * 100)
      return (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-blue-600">${numericPrice.toFixed(2)}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              Save {savingsPercent}%
            </span>
          </div>
        </div>
      )
    }

    return <span className="text-lg font-bold text-blue-600">${numericPrice.toFixed(2)}</span>
  }

  const handleAddToCart = (product) => {
    console.log("Adding product to cart:", product)
    alert(`Added ${product.name} to cart!`)
  }

  const handleViewProduct = (product) => {
    console.log("Viewing product:", product)
    alert(`Viewing details for ${product.name}`)
  }

  const placeOrder = async () => {
    setIsProcessing(true)
    setIsLoadingRecommendations(true)
    try {
      const cartProductList = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))

      const response = await fetch(`${API_BASE_URL}/api/get-allproducts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartItems: cartProductList,
          totalAmount: getTotalPrice(),
          customerInfo: formData,
        }),
      })

      const data = await response.json()
      setLlmRecommendations(data.recommendations || "Thank you for choosing Walmart!")
      setSuggestedProducts(data.suggestedProducts || [])
      setTotalProductsFound(data.totalProductsFound || 0)
    } catch (error) {
      console.error("Error placing order:", error)

      const productNames = cartItems.map((item) => item.name).join(", ")
      const mockRecommendations = `Hey there, valued Walmart customer! 🌟

Thank you for choosing Walmart for your ${productNames} purchase! You've made some excellent choices, and we're here to help you save money and live better.

**Smart Shopping Tips for Your Purchase:**

* **Walmart+ Benefits:** As a Walmart+ member, you get free delivery, member prices on fuel, and exclusive early access to deals - perfect for maximizing your savings on future tech purchases.

* **Extended Protection:** Consider our Walmart Protection Plans for your electronics - they're up to 50% less expensive than manufacturer warranties and cover accidental damage.

* **Great Value Accessories:** Pair your purchase with our Great Value brand accessories - same quality, better prices. Think charging cables, cases, and screen protectors.

* **Rollback Alerts:** Set up alerts for price drops on related items. Our Rollback prices can save you up to 40% on complementary products.

**Exclusive Walmart Recommendations:**

* **Tech Bundle Savings:** Complete your setup with our exclusive tech bundles - when you buy 3+ accessories, save an additional 15%.

* **Pickup & Save:** Choose free store pickup to save on delivery fees and get your items faster - often ready in just 2 hours.

* **Walmart Cash:** Earn 5% Walmart Cash on this purchase when you use the Walmart Rewards Card - that's money back for your next shopping trip.

**Why You Made the Right Choice:**

Shopping at Walmart means you're getting everyday low prices, backed by our price match guarantee. Plus, with over 4,700 stores nationwide, support and returns are always convenient.

**Save Money. Live Better.** - That's not just our motto, it's our promise to you. Thank you for letting us be part of your smart shopping journey! 💙💛`

      setLlmRecommendations(mockRecommendations)
      setSuggestedProducts([])
      setTotalProductsFound(0)
    } finally {
      setIsLoadingRecommendations(false)
      setTimeout(() => {
        setIsProcessing(false)
        setOrderPlaced(true)
      }, 2000)
    }
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full bg-white rounded-2xl shadow-xl p-8 border-t-4 border-blue-600">
          {/* Walmart Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <WalmartSpark className="w-8 h-8" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-blue-600">Walmart</h1>
                <p className="text-sm text-gray-600">Save money. Live better.</p>
              </div>
            </div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h2>
            <p className="text-gray-600 text-lg">Order #WMT-{Date.now().toString().slice(-6)}</p>

            {/* Delivery Options */}
            <div className="flex justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">2-Day Shipping</span>
              </div>
            </div>
          </div>

          {/* Order Summary with Walmart styling */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-8 border border-blue-200">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-blue-900 text-lg">Your Walmart Order</h3>
            </div>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 bg-white rounded-lg px-4">
                  <span className="text-gray-700 font-medium">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-blue-300 pt-3 mt-3 bg-white rounded-lg px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Savings</span>
                  <span className="text-lg font-bold text-green-600">${(getTotalPrice() * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xl font-bold text-gray-900">You Paid</span>
                  <span className="text-xl font-bold text-blue-600">${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Walmart AI Assistant */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <h3 className="font-bold text-xl">Walmart Smart Assistant</h3>
                <p className="text-blue-100 flex items-center gap-2">
                  <WalmartSpark className="w-4 h-4" />
                  Powered by AI • Personalized for You
                </p>
              </div>
            </div>

            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center gap-4 py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                  <div className="animate-ping absolute inset-0 rounded-full h-8 w-8 border border-yellow-300 opacity-20"></div>
                </div>
                <span className="text-white font-medium text-lg">Finding ways to save you more money...</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <div className="prose prose-lg max-w-none">
                  <div className="space-y-2">{formatLLMRecommendations(llmRecommendations)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Walmart+ Benefits Banner */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 mb-8 text-blue-900">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">Walmart+ Member Benefits</h3>
                <p className="text-sm opacity-90">Free delivery • Member prices on fuel • Early access to deals</p>
              </div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Enhanced Suggested Products with Walmart theming */}
          {!isLoadingRecommendations && suggestedProducts.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mb-8 border border-green-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Tag className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xl">Rollback Deals Just for You</h3>
                    <p className="text-sm text-gray-600">{totalProductsFound} products with everyday low prices</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedProducts.map((product, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative">
                      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-400" />
                      </div>
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        Rollback
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 flex-1">
                          {product.name}
                        </h4>
                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-2">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      {product.brand && <p className="text-xs text-gray-500 mb-3">by {product.brand}</p>}

                      <div className="mb-3">{formatPrice(product.price, product.originalPrice)}</div>

                      {product.rating && <div className="mb-3">{renderStarRating(product.rating)}</div>}

                      {product.description && (
                        <p className="text-xs text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        {product.category && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            {product.category}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Shield className="w-3 h-3" />
                          <span>Free Returns</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Cart
                        </button>
                        <div className="flex gap-2">
                          <button className="flex-1 bg-yellow-400 text-blue-900 py-2 px-3 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors flex items-center justify-center gap-1">
                            <Store className="w-3 h-3" />
                            Pickup
                          </button>
                          <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <WalmartSpark className="w-5 h-5" />
            Continue Shopping at Walmart
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-yellow-50">
      {/* Walmart Header */}
      <header className="bg-white shadow-sm border-b-2 border-blue-600">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Cart
            </button>
            <div className="flex items-center gap-2">
              <WalmartSpark className="w-6 h-6" />
              <span className="font-bold text-blue-600">Walmart</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Secure Checkout</h1>
          <p className="text-sm text-gray-600">Save money. Live better.</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Delivery Options */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                Delivery Options
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50">
                  <input
                    type="radio"
                    name="delivery"
                    value="delivery"
                    checked={deliveryOption === "delivery"}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Free Delivery</span>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">FREE</span>
                    </div>
                    <p className="text-sm text-gray-600">2-3 business days</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-yellow-50">
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryOption === "pickup"}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">Store Pickup</span>
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">FAST</span>
                    </div>
                    <p className="text-sm text-gray-600">Ready in 2 hours</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">Contact Information</h2>
              </div>
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email address"
                  value={formData.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  {deliveryOption === "pickup" ? "Store Location" : "Shipping Address"}
                </h2>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                  <input
                    type="text"
                    placeholder="ZIP code"
                    value={formData.zipCode}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">Payment Information</h2>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Card number"
                  value={formData.cardNumber}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={formData.expiryDate}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    value={formData.cvv}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit border-l-4 border-yellow-400">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
            </div>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                    <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Rollback</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Walmart+ Benefits */}
            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Walmart+ Benefits Applied</span>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Free delivery (save $9.95)</li>
                <li>• Member fuel discount</li>
                <li>• Early access to deals</li>
              </ul>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Delivery Savings</span>
                <span>-$9.95</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${(getTotalPrice() * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-blue-600">${(getTotalPrice() * 1.08 - 9.95).toFixed(2)}</span>
              </div>
              <div className="text-center text-sm text-green-600 font-medium">You saved $9.95 with Walmart+!</div>
            </div>

            <button
              onClick={placeOrder}
              disabled={isProcessing || cartItems.length === 0}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-900 py-4 rounded-lg font-bold hover:from-yellow-500 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mt-6 shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-900"></div>
                  Processing Your Order...
                </div>
              ) : (
                <>
                  <WalmartSpark className="w-5 h-5" />
                  Place Order • ${(getTotalPrice() * 1.08 - 9.95).toFixed(2)}
                </>
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-xs text-gray-600">
                <Shield className="w-3 h-3 inline mr-1" />
                Secure checkout • Price match guarantee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
