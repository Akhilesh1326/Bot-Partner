import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, MapPin, User, ShoppingBag, Bot, CheckCircle, Star, Plus, Heart, Eye } from 'lucide-react';

const Checkout = ({ cartItems = [], onBack, getTotalPrice }) => {
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [llmRecommendations, setLlmRecommendations] = useState('');
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [totalProductsFound, setTotalProductsFound] = useState(0);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // API base URL - should match your main app
  const API_BASE_URL = 'http://localhost:8000';

  // Mock form data
  const [formData, setFormData] = useState({
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Main St',
    city: 'New York',
    zipCode: '10001',
    cardNumber: '**** **** **** 1234',
    expiryDate: '12/25',
    cvv: '***'
  });

  // Enhanced function to format LLM recommendations
  const formatLLMRecommendations = (text) => {
    if (!text) return null;

    // Split text into lines and process each one
    const lines = text.split('\n').filter(line => line.trim());
    const formattedElements = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) return;
      
      // Check if line starts with bullet points or numbers
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('*') || trimmedLine.startsWith('-')) {
        // Format as bullet point
        const content = trimmedLine.replace(/^[•*-]\s*/, '');
        formattedElements.push(
          <div key={index} className="flex items-start gap-3 mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700 leading-relaxed">{content}</p>
          </div>
        );
      } else if (/^\d+\./.test(trimmedLine)) {
        // Format as numbered list
        const content = trimmedLine.replace(/^\d+\.\s*/, '');
        const number = trimmedLine.match(/^(\d+)\./)[1];
        formattedElements.push(
          <div key={index} className="flex items-start gap-3 mb-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {number}
            </div>
            <p className="text-gray-700 leading-relaxed">{content}</p>
          </div>
        );
      } else if (trimmedLine.endsWith(':') && trimmedLine.length < 50) {
        // Format as section header
        formattedElements.push(
          <h4 key={index} className="text-lg font-semibold text-gray-800 mb-2 mt-4">
            {trimmedLine}
          </h4>
        );
      } else {
        // Format as regular paragraph
        formattedElements.push(
          <p key={index} className="text-gray-700 leading-relaxed mb-3">
            {trimmedLine}
          </p>
        );
      }
    });

    return formattedElements;
  };

  // Function to render star rating
  const renderStarRating = (rating) => {
    if (!rating) return null;
    const stars = [];
    const numericRating = parseFloat(rating);
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i <= numericRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-sm text-gray-600 ml-1">({numericRating})</span>
      </div>
    );
  };

  // Function to format price
  const formatPrice = (price) => {
    if (!price) return 'Price not available';
    if (typeof price === 'string') {
      // Remove currency symbols and parse
      const cleanPrice = price.replace(/[$,]/g, '');
      const numericPrice = parseFloat(cleanPrice);
      return isNaN(numericPrice) ? price : `$${numericPrice.toFixed(2)}`;
    }
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Function to handle adding product to cart (mock implementation)
  const handleAddToCart = (product) => {
    console.log('Adding product to cart:', product);
    // In a real app, you would call your add to cart function here
    alert(`Added ${product.name} to cart!`);
  };

  // Function to handle view product details (mock implementation)
  const handleViewProduct = (product) => {
    console.log('Viewing product:', product);
    // In a real app, you would navigate to product detail page
    alert(`Viewing details for ${product.name}`);
  };

  const placeOrder = async () => {
    setIsProcessing(true);
    setIsLoadingRecommendations(true);

    try {
      // Prepare cart data for API call
      const cartProductList = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      console.log('Sending cart data to API:', cartProductList);

      // Make API call to get LLM recommendations
      const response = await fetch(`${API_BASE_URL}/api/get-allproducts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartProductList,
          totalAmount: getTotalPrice(),
          customerInfo: formData
        })
      });

      const data = await response.json();
      console.log('API Response:', data);

      // Set data from API response
      setLlmRecommendations(data.recommendations || 'Thank you for your purchase! We hope you enjoy your items.');
      setSuggestedProducts(data.suggestedProducts || []);
      setTotalProductsFound(data.totalProductsFound || 0);

    } catch (error) {
      console.error('Error placing order:', error);
      
      // Fallback mock LLM recommendations
      const productNames = cartItems.map(item => item.name).join(', ');
      const mockRecommendations = `Thank you for your purchase of ${productNames}!

Here are some personalized recommendations based on your order:

• Consider getting a protective case if you ordered electronics - it will extend the life of your devices significantly
• These items pair exceptionally well with our premium accessories collection
• Don't forget to explore our extended warranty options for added peace of mind
• You might also be interested in our related products in the same category

Additional Tips:
• Your order will be carefully processed and shipped within 24 hours
• Track your package using the confirmation email we'll send shortly
• Join our loyalty program to earn rewards on future purchases

Thank you for choosing us for your shopping needs!`;
      
      setLlmRecommendations(mockRecommendations);
      setSuggestedProducts([]);
      setTotalProductsFound(0);
    } finally {
      setIsLoadingRecommendations(false);
      
      // Simulate order processing time
      setTimeout(() => {
        setIsProcessing(false);
        setOrderPlaced(true);
      }, 2000);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-6xl w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600">Order #WMT-{Date.now().toString().slice(-6)}</p>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.name} x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced LLM Recommendations */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">AI-Powered Recommendations</h3>
                <p className="text-sm text-gray-600">Powered by Gemini 1.5 Flash</p>
              </div>
            </div>
            
            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700 font-medium">Generating personalized recommendations...</span>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="prose prose-sm max-w-none">
                  {formatLLMRecommendations(llmRecommendations)}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Suggested Products Section */}
          {!isLoadingRecommendations && suggestedProducts.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Recommended Products</h3>
                    <p className="text-sm text-gray-600">Found {totalProductsFound} products that match your preferences</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedProducts.map((product, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Product Image Placeholder */}
                    <div className="h-48 bg-gray-100 flex items-center justify-center">
                      <ShoppingBag className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                          {product.name}
                        </h4>
                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {product.brand && (
                        <p className="text-xs text-gray-500 mb-2">by {product.brand}</p>
                      )}
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.rating && renderStarRating(product.rating)}
                      </div>
                      
                      {product.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        {product.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {product.category}
                          </span>
                        )}
                        {product.stock && (
                          <span className={`text-xs ${parseInt(product.stock) > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                            {parseInt(product.stock) > 10 ? 'In Stock' : `Only ${product.stock} left`}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleViewProduct(product)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Products Found Message */}
          {!isLoadingRecommendations && suggestedProducts.length === 0 && totalProductsFound === 0 && (
            <div className="bg-yellow-50 rounded-xl p-6 mb-6 border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">No Product Recommendations Found</h3>
                  <p className="text-sm text-gray-600">We couldn't find specific products to recommend, but check out our AI suggestions above!</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onBack}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Cart
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
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
                <h2 className="text-lg font-semibold text-gray-800">Shipping Address</h2>
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
          <div className="bg-white rounded-lg shadow-sm p-6 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Order Summary</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              {cartItems.map(item => (
                <div key={item.id} className="flex gap-3 p-3 border border-gray-200 rounded-lg">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
                    <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${(getTotalPrice() * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>${(getTotalPrice() * 1.08).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={isProcessing || cartItems.length === 0}
              className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  Processing Order...
                </div>
              ) : (
                `Place Order • $${(getTotalPrice() * 1.08).toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;