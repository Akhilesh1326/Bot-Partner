import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ShoppingCart, MessageCircle, Plus, Minus, X, Star, Heart, Send, Bot, User, ChevronRight, Home, Menu, Search } from 'lucide-react';
import Checkout from './Checkout';


const EcommerceCart = () => {
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const chatEndRef = useRef(null);

  // Navigation state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [currentView, setCurrentView] = useState('categories'); // 'categories', 'subcategories', 'products'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ name: 'Home', view: 'categories' }]);

  // API base URL - update this to match your server
  const API_BASE_URL = 'http://localhost:8000'; // Update this to your server URL

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    fetchCategories();
  }, []);

  // API calls
  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      const data = await response.json();
      if (response.ok) {
        setCategories(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to connect to server');
      // Fallback to mock data for demo
      setCategories([
        { id: 1, name: 'Electronics', description: 'TVs, Phones, Computers & more' },
        { id: 2, name: 'Clothing', description: 'Fashion for Men, Women & Kids' },
        { id: 3, name: 'Home & Garden', description: 'Furniture, Decor & Appliances' },
        { id: 4, name: 'Sports & Outdoors', description: 'Fitness, Recreation & Outdoor Gear' },
        { id: 5, name: 'Health & Beauty', description: 'Personal Care & Wellness' },
        { id: 6, name: 'Grocery', description: 'Food, Beverages & Household Items' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategoryById = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/category/${categoryId}`);
      const data = await response.json();
      if (response.ok) {
        return data.data;
      }
      throw new Error(data.message || 'Failed to fetch category');
    } catch (error) {
      console.error('Error fetching category:', error);
      return null;
    }
  };

  const fetchSubCategories = async (categoryId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/all-subcategory/${categoryId}`);
      const data = await response.json();
      if (response.ok) {
        setSubCategories(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch subcategories');
        // Fallback mock data
        const mockSubCategories = {
          1: [
            { id: 1, name: 'Smartphones', description: 'Latest mobile phones' },
            { id: 2, name: 'Laptops', description: 'Computers & accessories' },
            { id: 3, name: 'TVs', description: 'Smart TVs & home theater' }
          ],
          2: [
            { id: 4, name: 'Men\'s Clothing', description: 'Shirts, pants & accessories' },
            { id: 5, name: 'Women\'s Clothing', description: 'Dresses, tops & more' },
            { id: 6, name: 'Kids\' Clothing', description: 'Children\'s apparel' }
          ]
        };
        setSubCategories(mockSubCategories[categoryId] || []);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductsBySubCategory = async (subCategoryId) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sub-category/${subCategoryId}/products`);
      const data = await response.json();
      if (response.ok) {
        setProducts(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch products');
        // Fallback mock data
        const mockProducts = [
          { id: 1, name: "Samsung Galaxy S24 Ultra", price: 1199.99, image: "https://via.placeholder.com/200x200/007bff/ffffff?text=Samsung+S24", rating: 4.5, reviews: 1250, description: "Latest flagship smartphone" },
          { id: 2, name: "Apple iPhone 15 Pro", price: 999.99, image: "https://via.placeholder.com/200x200/000000/ffffff?text=iPhone+15", rating: 4.8, reviews: 3400, description: "Premium Apple smartphone" },
          { id: 3, name: "Google Pixel 8 Pro", price: 899.99, image: "https://via.placeholder.com/200x200/4285f4/ffffff?text=Pixel+8", rating: 4.3, reviews: 890, description: "Google's flagship phone" },
          { id: 4, name: "OnePlus 12", price: 799.99, image: "https://via.placeholder.com/200x200/ff0000/ffffff?text=OnePlus+12", rating: 4.7, reviews: 2100, description: "Fast and affordable flagship" }
        ];
        setProducts(mockProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };



  const fetchRecommendations = async (productName, price) => {
    setIsLoadingRecommendations(true);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `Added "${productName}" ($${price}) to cart`
    };

    console.log(userMessage);
    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Use query params for GET request
      const response = await axios.get(`${API_BASE_URL}/api/get-recomendations`, {
        params: { productName, price }
      });

      console.log("Called for recommendations");
      console.log("Response =", response);

      const data = response.data;

      setRecommendations(data.recomendations || []);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Great choice! Based on your selection of "${productName}", here are some recommendations:`,
        recommendations: data.recomendations || []
      };
      setChatMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error fetching recommendations:', error);

      // Fallback mock recommendations
      const mockRecommendations = products
        .filter(p => p.name !== productName)
        .slice(0, 3)
        .map(product => ({
          ...product,
          reason: `Customers who bought "${productName}" also bought this`
        }));

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: `Great choice! Based on your selection of "${productName}", here are some recommendations:`,
        recommendations: mockRecommendations
      };
      setChatMessages(prev => [...prev, botMessage]);

    } finally {
      setIsLoadingRecommendations(false);
    }
  };


  // Navigation handlers
  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setCurrentView('subcategories');
    setBreadcrumbs([
      { name: 'Home', view: 'categories' },
      { name: category.name, view: 'subcategories', categoryId: category.id }
    ]);
    await fetchSubCategories(category.id);
  };

  const handleSubCategoryClick = async (subCategory) => {
    setSelectedSubCategory(subCategory);
    setCurrentView('products');
    setBreadcrumbs([
      { name: 'Home', view: 'categories' },
      { name: selectedCategory.name, view: 'subcategories', categoryId: selectedCategory.id },
      { name: subCategory.name, view: 'products', subCategoryId: subCategory.id }
    ]);
    await fetchProductsBySubCategory(subCategory.id);
  };

  const handleBreadcrumbClick = (breadcrumb) => {
    if (breadcrumb.view === 'categories') {
      setCurrentView('categories');
      setBreadcrumbs([{ name: 'Home', view: 'categories' }]);
      setSelectedCategory(null);
      setSelectedSubCategory(null);
    } else if (breadcrumb.view === 'subcategories') {
      setCurrentView('subcategories');
      setBreadcrumbs(breadcrumbs.slice(0, 2));
      setSelectedSubCategory(null);
    }
  };

  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);

    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }

    setShowRecommendations(true);
    fetchRecommendations(product.name, product.price);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Component renders
  const CategoryCard = ({ category }) => (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => handleCategoryClick(category)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.name}</h3>
          <p className="text-gray-600">{category.description}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );

  const SubCategoryCard = ({ subCategory }) => (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => handleSubCategoryClick(subCategory)}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{subCategory.name}</h3>
          <p className="text-gray-600">{subCategory.description}</p>
        </div>
        <ChevronRight className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-md mb-3" />
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
          <Heart className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.name}</h3>
      {product.description && (
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
      )}
      <div className="flex items-center mb-2">
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
          <span className="text-sm text-gray-500 ml-2">({product.reviews} reviews)</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-blue-600">${product.price}</span>
        <button
          onClick={() => addToCart(product)}
          className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add to Cart
        </button>
      </div>
    </div>
  );

  const RecommendationCard = ({ product, reason }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-md" />
        <div className="flex-1">
          <h4 className="font-medium text-gray-800 text-sm line-clamp-2">{product.name}</h4>
          <div className="flex items-center mt-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{reason}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-bold text-blue-600">${product.price}</span>
            <button
              onClick={() => addToCart(product)}
              className="bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors text-xs"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ChatMessage = ({ message }) => (
    <div className={`flex gap-3 mb-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'bot' && (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-800'
        }`}>
        <p className="text-sm">{message.content}</p>
        {message.recommendations && (
          <div className="mt-3 space-y-2">
            {message.recommendations.map((rec, index) => (
              <RecommendationCard key={index} product={rec} reason={rec.reason} />
            ))}
          </div>
        )}
      </div>
      {message.type === 'user' && (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );

  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 mb-6">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => handleBreadcrumbClick(breadcrumb)}
            className={`text-sm ${index === breadcrumbs.length - 1
                ? 'text-gray-800 font-medium'
                : 'text-blue-600 hover:text-blue-800'
              }`}
          >
            {breadcrumb.name}
          </button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const ErrorMessage = () => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p className="text-red-800">{error}</p>
      <button
        onClick={() => {
          setError(null);
          if (currentView === 'categories') fetchCategories();
          else if (currentView === 'subcategories') fetchSubCategories(selectedCategory.id);
          else if (currentView === 'products') fetchProductsBySubCategory(selectedSubCategory.id);
        }}
        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
      >
        Try again
      </button>
    </div>
  );

   if (showCheckout) {
    return (
      <Checkout 
        cartItems={cartItems}
        onBack={() => setShowCheckout(false)}
        getTotalPrice={getTotalPrice}
      />
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Walmart</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="relative p-2 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors"
              >
                <MessageCircle className="w-6 h-6" />
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {chatMessages.filter(m => m.type === 'bot').length}
                  </span>
                )}
              </button>
              <button className="relative p-2 bg-blue-700 rounded-full hover:bg-blue-800 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getTotalItems()}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search everything at Walmart online and in store"
              className="w-full pl-10 pr-4 py-3 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Main Content */}
        <main className={`flex-1 p-6 transition-all duration-300 ${showRecommendations ? 'mr-96' : ''}`}>
          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Shopping Cart ({getTotalItems()} items)</h2>
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{item.name}</h3>
                      <p className="text-lg font-bold text-blue-600">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 bg-gray-200 rounded-full hover:bg-gray-300"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, 0)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total: ${getTotalPrice().toFixed(2)}</span>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="bg-yellow-500 text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-600 transition-colors"
                  >
                    Checkout
                  </button>
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
          {!isLoading && currentView === 'categories' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Shop by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {/* Subcategories View */}
          {!isLoading && currentView === 'subcategories' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedCategory?.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subCategories.map(subCategory => (
                  <SubCategoryCard key={subCategory.id} subCategory={subCategory} />
                ))}
              </div>
            </div>
          )}

          {/* Products View */}
          {!isLoading && currentView === 'products' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedSubCategory?.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Recommendations Sidebar */}
        {showRecommendations && (
  <div className="fixed right-0 top-0 w-96 h-screen bg-white shadow-xl border-l border-gray-200 z-50 flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">AI Shopping Assistant</h3>
      </div>
      <button
        onClick={() => setShowRecommendations(false)}
        className="p-1 hover:bg-white/80 rounded-full transition-colors"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>
    </div>

    {/* Main Content Area */}
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="bg-gray-50 rounded-full p-6 mb-4">
              <Bot className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Add items to your cart and I'll suggest products you might like!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chatMessages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoadingRecommendations && (
              <div className="flex gap-3 animate-fadeIn">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">Finding recommendations...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default EcommerceCart; 