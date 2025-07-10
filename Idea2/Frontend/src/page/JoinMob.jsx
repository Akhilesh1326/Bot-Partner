import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import socket from "../socket";

const MobJoin = () => {
  const { mobId } = useParams();
  const navigate = useNavigate();
  const [count, setCount] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [timer, setTimer] = useState(900); // 15 minutes
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobEnded, setMobEnded] = useState(false);
  const [mobData, setMobData] = useState(null);

  const getDiscountByParticipants = (participantCount) => {
    if (participantCount >= 20) return 25;
    if (participantCount >= 10) return 15;
    if (participantCount >= 5) return 10;
    if (participantCount >= 2) return 5;
    return 0;
  };

  const getNextTier = (currentCount) => {
    const tiers = [2, 5, 10, 20];
    return tiers.find(tier => tier > currentCount) || null;
  };

  useEffect(() => {
    // Join the mob
    socket.emit("join-mob", { mobId, userId: "Friend_" + Date.now() });

    // Listen for mob updates
    const handleMobUpdate = ({ users, discount: serverDiscount, mobInfo }) => {
      setCount(users.length);
      // Use server discount or calculate based on participant count
      const calculatedDiscount = getDiscountByParticipants(users.length);
      setDiscount(serverDiscount || calculatedDiscount);
      setMobData(mobInfo);
      setLoading(false);
    };

    // Listen for mob end
    const handleMobEnd = (mobDataEnd) => {
      setMobEnded(true);
      setLoading(false);
      setMobData(mobDataEnd);
    };

    // Listen for errors
    const handleError = ({ message }) => {
      setError(message);
      setLoading(false);
    };

    // Set up event listeners
    socket.on("mob-update", handleMobUpdate);
    socket.on("mob-end", handleMobEnd);
    socket.on("error", handleError);

    // Timer countdown
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          setMobEnded(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Cleanup function
    return () => {
      clearInterval(interval);
      socket.off("mob-update", handleMobUpdate);
      socket.off("mob-end", handleMobEnd);
      socket.off("error", handleError);
    };
  }, [mobId]);

  const formatTime = (s) => {
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleAddToCart = () => {
    if (mobEnded) {
      alert("This mob has ended!");
      return;
    }
    
    // Add your cart logic here
    alert(`Added to cart with ${discount}% discount!`);
  };

  const handleBackToMobs = () => {
    navigate("/mob");
  };

  const copyMobLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  const shareOnWhatsApp = () => {
    const message = `🔥 Join my Flash Mob and save ${discount}% on amazing products! Only ${formatTime(timer)} left! ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Joining Flash Mob...</h2>
          <p className="text-gray-600">Please wait while we connect you to the mob</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={handleBackToMobs}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Find Another Mob
          </button>
        </div>
      </div>
    );
  }

  if (mobEnded) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-xl font-bold text-yellow-600 mb-4">Flash Mob Ended</h2>
          <p className="text-gray-600 mb-2">This shopping mob has concluded</p>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <p className="text-green-800 font-semibold">Final Results:</p>
            <p className="text-2xl font-bold text-green-600">{discount}% OFF</p>
            <p className="text-sm text-gray-600">{count} participants joined</p>
          </div>
          <button 
            onClick={handleBackToMobs}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Join Another Mob
          </button>
        </div>
      </div>
    );
  }

  const nextTier = getNextTier(count);
  const currentTierColor = discount >= 25 ? 'purple' : discount >= 15 ? 'green' : discount >= 10 ? 'orange' : discount >= 5 ? 'red' : 'gray';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <button 
            onClick={handleBackToMobs}
            className="flex items-center text-white hover:text-blue-200 mb-2"
          >
            ← Back to Mobs
          </button>
          <h1 className="text-2xl font-bold">🔥 Flash Mob Live!</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Mob Status Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎯</div>
              <h2 className="text-xl font-bold text-gray-800">You're In The Mob!</h2>
              <p className="text-gray-600">Great choice! You're saving money together.</p>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600">👥 Participants</div>
              </div>
              <div className={`text-center p-4 bg-${currentTierColor}-50 rounded-lg`}>
                <div className={`text-3xl font-bold text-${currentTierColor}-600`}>{discount}%</div>
                <div className="text-sm text-gray-600">💰 Current Discount</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{formatTime(timer)}</div>
                <div className="text-sm text-gray-600">⏰ Time Left</div>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-yellow-800">
                    Next Tier: {getDiscountByParticipants(nextTier)}% OFF
                  </span>
                  <span className="text-sm text-yellow-700">
                    {nextTier - count} more needed
                  </span>
                </div>
                <div className="w-full bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(count / nextTier) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Mob ID */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-xs text-gray-600 mb-1">Mob ID:</p>
              <p className="font-mono text-sm text-gray-800 break-all">{mobId}</p>
            </div>
          </div>

          {/* Discount Tiers */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Discount Tiers</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { people: 2, discount: 5, color: 'red' },
                { people: 5, discount: 10, color: 'orange' },
                { people: 10, discount: 15, color: 'green' },
                { people: 20, discount: 25, color: 'purple' }
              ].map(({ people, discount: tierDiscount, color }) => (
                <div key={people} className={`p-3 rounded-lg border-2 ${
                  count >= people 
                    ? `bg-${color}-100 border-${color}-400` 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className={`text-center ${
                    count >= people ? `text-${color}-600` : 'text-gray-400'
                  }`}>
                    <div className="text-lg font-bold">{people}+</div>
                    <div className="text-xs">People</div>
                    <div className="text-sm font-bold">{tierDiscount}% OFF</div>
                    {count >= people && (
                      <div className="text-green-600 text-xs mt-1">✓ Unlocked!</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Invite More Friends</h3>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg mb-4">
              <p className="text-sm font-medium">💡 Pro Tip:</p>
              <p className="text-sm">Share this link with friends who want the same products. Everyone gets the same discount!</p>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={copyMobLink}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center"
              >
                📋 Copy Link
              </button>
              <button 
                onClick={shareOnWhatsApp}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center"
              >
                📱 WhatsApp
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mb-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  Save {discount}% Now!
                </div>
                <p className="text-sm text-gray-600">
                  {mobEnded ? 'This mob has ended' : 'Lock in your discount before time runs out'}
                </p>
              </div>
              
              <button 
                onClick={handleAddToCart}
                disabled={mobEnded}
                className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  mobEnded 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                    : 'bg-yellow-400 text-blue-900 hover:bg-yellow-500 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {mobEnded ? 'Mob Ended' : `🛒 Add to Cart (${discount}% OFF)`}
              </button>
              
              {!mobEnded && (
                <p className="text-xs text-gray-500 mt-2">
                  Discount applies automatically at checkout
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobJoin;