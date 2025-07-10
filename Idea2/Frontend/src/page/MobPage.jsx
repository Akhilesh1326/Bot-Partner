import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../socket";

const MobPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobId, setMobId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState(1);
  const [currentDiscount, setCurrentDiscount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  const [mobStarted, setMobStarted] = useState(false);
  
  // Get cart items from location state
  const cartItems = location.state?.cartItems || [];
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getDiscountByParticipants = (count) => {
    if (count >= 20) return 25;
    if (count >= 10) return 15;
    if (count >= 5) return 10;
    if (count >= 2) return 5;
    return 0;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (mobStarted && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setMobStarted(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [mobStarted, timeLeft]);

  useEffect(() => {
    if (mobId) {
      const handleMobUpdate = ({ users, discount }) => {
        setParticipants(users.length);
        setCurrentDiscount(discount);
      };

      socket.on("mob-update", handleMobUpdate);
      return () => socket.off("mob-update", handleMobUpdate);
    }
  }, [mobId]);

  const startMob = () => {
    setIsLoading(true);
    setError(null);
    
    socket.emit("start-mob", { 
      productId: "123", 
      userId: "Host_" + Date.now(),
      cartItems: cartItems 
    }, (response) => {
      setIsLoading(false);
      if (response.success) {
        setMobId(response.mobId);
        setMobStarted(true);
        setTimeLeft(900); // Reset timer
      } else {
        setError(response.message || "Failed to start mob");
      }
    });
  };

  const copyMobLink = () => {
    if (mobId) {
      const link = `${window.location.origin}/mob/${mobId}`;
      navigator.clipboard.writeText(link);
      alert("Link copied to clipboard!");
    }
  };

  const goToMobJoin = () => {
    if (mobId) {
      navigate(`/mob/${mobId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-blue-200 mb-2"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Flash Mob Control Center</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Cart Items Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Your Mob Products</h2>
            <div className="grid gap-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold">{item.name.charAt(0)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Value:</span>
                <span className="text-2xl font-bold text-blue-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Discount Tiers */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Discount Tiers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { people: 2, discount: 5, color: 'red' },
                { people: 5, discount: 10, color: 'orange' },
                { people: 10, discount: 15, color: 'green' },
                { people: 20, discount: 25, color: 'purple' }
              ].map(({ people, discount, color }) => (
                <div key={people} className={`p-4 rounded-lg border-2 ${
                  participants >= people 
                    ? `bg-${color}-100 border-${color}-400` 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-center ${
                    participants >= people ? `text-${color}-600` : 'text-gray-400'
                  }`}>
                    <div className="text-2xl font-bold">{people}+</div>
                    <div className="text-sm">People</div>
                    <div className="text-lg font-bold">{discount}% OFF</div>
                    <div className="text-xs">Save ${(totalPrice * discount / 100).toFixed(2)}</div>
                    {participants >= people && (
                      <div className="text-green-600 text-xs mt-1">✓ Unlocked!</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mob Status */}
          {!mobStarted ? (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Ready to Start Your Flash Mob?</h2>
                <p className="text-gray-600 mb-6">
                  Click the button below to create your mob and start inviting friends!
                </p>
                
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                <button 
                  onClick={startMob}
                  disabled={isLoading || cartItems.length === 0}
                  className={`px-8 py-4 rounded-lg font-bold text-lg transition-all ${
                    isLoading || cartItems.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-yellow-400 text-blue-900 hover:bg-yellow-500 hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-900 mr-2"></div>
                      Starting Mob...
                    </div>
                  ) : (
                    '🔥 Start Flash Mob'
                  )}
                </button>
                
                {cartItems.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">
                    Please add items to your cart first
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🔥</div>
                <h2 className="text-2xl font-bold text-gray-800">Your Flash Mob is Live!</h2>
                <p className="text-gray-600">Share the link below with friends</p>
              </div>

              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{participants}</div>
                  <div className="text-sm text-gray-600">👥 Participants</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{currentDiscount}%</div>
                  <div className="text-sm text-gray-600">💰 Current Discount</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600">{formatTime(timeLeft)}</div>
                  <div className="text-sm text-gray-600">⏰ Time Left</div>
                </div>
              </div>

              {/* Share Link */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">Mob ID:</p>
                <div className="flex items-center">
                  <code className="flex-1 bg-white p-2 rounded border font-mono text-sm">
                    {window.location.origin}/mob/{mobId}
                  </code>
                  <button 
                    onClick={copyMobLink}
                    className="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button 
                  onClick={goToMobJoin}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-semibold"
                >
                  🎯 Join Your Own Mob
                </button>
                <button 
                  onClick={copyMobLink}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold"
                >
                  📤 Share Link
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-3">How to Maximize Your Savings:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">📱 Share Everywhere:</h4>
                <ul className="space-y-1">
                  <li>• WhatsApp family groups</li>
                  <li>• Social media posts</li>
                  <li>• Email to friends</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⏰ Act Fast:</h4>
                <ul className="space-y-1">
                  <li>• 15-minute time limit</li>
                  <li>• More people = bigger savings</li>
                  <li>• Everyone gets the same discount</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobPage;