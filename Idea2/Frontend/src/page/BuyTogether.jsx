import { useNavigate } from "react-router";

const BuyTogether = ({ cartItems = [], onBack, getTotalPrice }) => {
  const navigate = useNavigate();
  
  const calculateTotalPrice = () => {
    if (typeof getTotalPrice === 'function') {
      return getTotalPrice();
    }
    return cartItems.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);
  };
  
  const totalPrice = calculateTotalPrice();

  const handleStartMob = () => {
    navigate("/MobPage", { state: { cartItems } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center text-white hover:text-blue-200 mb-2"
          >
            ← Back to Cart
          </button>
          <h1 className="text-2xl font-bold">Buy Together & Save More</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Info Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-400 rounded-full p-3 mr-4">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Flash Mob Shopping</h2>
                <p className="text-gray-600">Team up with friends and save together!</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold text-blue-800">Invite Friends</h3>
                <p className="text-sm text-gray-600">Share your mob link with friends and family</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-semibold text-green-800">Save More</h3>
                <p className="text-sm text-gray-600">More people = bigger discounts for everyone</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl mb-2">⏰</div>
                <h3 className="font-semibold text-yellow-800">Limited Time</h3>
                <p className="text-sm text-gray-600">15 minutes to gather your shopping mob</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
              <h3 className="font-bold mb-2">How It Works:</h3>
              <ul className="space-y-1 text-sm">
                <li>• Start a flash mob with your current cart items</li>
                <li>• Share the link with friends who want the same products</li>
                <li>• Watch discounts increase as more people join</li>
                <li>• Everyone gets the same discount when they purchase</li>
              </ul>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Your Cart Items</h2>
            <div className="space-y-3">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">{item.name.charAt(0)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🛒</div>
                  <p>Your cart is empty</p>
                  <p className="text-sm">Add items to your cart to start a flash mob</p>
                </div>
              )}
            </div>
            
            {cartItems.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Discount Preview */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Potential Savings</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">2+ People</div>
                <div className="text-sm text-gray-600">5% OFF</div>
                <div className="text-xs text-green-600">Save ${(totalPrice * 0.05).toFixed(2)}</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">5+ People</div>
                <div className="text-sm text-gray-600">10% OFF</div>
                <div className="text-xs text-green-600">Save ${(totalPrice * 0.10).toFixed(2)}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">10+ People</div>
                <div className="text-sm text-gray-600">15% OFF</div>
                <div className="text-xs text-green-600">Save ${(totalPrice * 0.15).toFixed(2)}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">20+ People</div>
                <div className="text-sm text-gray-600">25% OFF</div>
                <div className="text-xs text-green-600">Save ${(totalPrice * 0.25).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button 
              onClick={handleStartMob}
              disabled={cartItems.length === 0}
              className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                cartItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-400 text-blue-900 hover:bg-yellow-500 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {cartItems.length === 0 ? 'Add Items to Cart First' : '🚀 Start Flash Mob'}
            </button>
            <p className="text-sm text-gray-600 mt-2">
              Ready to save big? Let's get your shopping mob started!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyTogether;