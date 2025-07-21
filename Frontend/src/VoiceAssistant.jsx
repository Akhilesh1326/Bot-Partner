"use client"

import { useState, useEffect, useRef } from "react"
import {
  Mic,
  MicOff,
  Send,
  ShoppingCart,
  Loader2,
  Bot,
  User,
  Volume2,
  VolumeX,
  Star,
  Plus,
  MessageCircle,
  Settings,
  RotateCcw,
} from "lucide-react"

const AIShoppingChat = ({ cartItems = [], onAddToCart, apiBaseUrl = "http://localhost:8000" }) => {
  // Chat states
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content:
        "Hi! I'm your AI shopping assistant. I can help you find products, suggest items that go well with your cart, or answer any shopping questions. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Settings
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Refs
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const synthRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if (!voiceEnabled) return

    const initializeSpeechRecognition = () => {
      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        return
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsListening(true)
        setTranscript("")
      }

      recognition.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)

        if (finalTranscript) {
          setInputMessage(finalTranscript)
          handleSendMessage(finalTranscript)
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        setTranscript("")
      }

      recognitionRef.current = recognition
    }

    initializeSpeechRecognition()

    // Initialize speech synthesis
    if ("speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis
    }
  }, [voiceEnabled])

  // Cart change notification
  useEffect(() => {
    if (cartItems.length > 0) {
      const latestItem = cartItems[cartItems.length - 1]
      const cartMessage = {
        id: Date.now(),
        type: "system",
        content: `${latestItem.name} has been added to your cart! Would you like me to suggest some items that go well with it?`,
        timestamp: new Date(),
        action: "suggest_related",
        productName: latestItem.name,
        productPrice: latestItem.price,
      }

      setMessages((prev) => [...prev, cartMessage])

      // Auto-suggest related products
      setTimeout(() => {
        fetchRelatedProducts(latestItem.name, latestItem.price)
      }, 1000)
    }
  }, [cartItems]) // Updated dependency to cartItems

  // Fetch related products
  const fetchRelatedProducts = async (productName, price) => {
    setIsTyping(true)

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/get-recomendations?productName=${encodeURIComponent(productName)}&price=${price}`,
      )

      if (response.ok) {
        const data = await response.json()
        const products = data.recomendations || []

        if (products.length > 0) {
          const recommendationMessage = {
            id: Date.now(),
            type: "assistant",
            content: `Great choice! I found ${products.length} products that go perfectly with ${productName}:`,
            timestamp: new Date(),
            products: products.slice(0, 4), // Limit to 4 products
          }

          setMessages((prev) => [...prev, recommendationMessage])

          if (autoSpeak) {
            speakText(`I found some great products that go well with ${productName}`)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching related products:", error)
    } finally {
      setIsTyping(false)
    }
  }

  // Handle sending messages
  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsProcessing(true)
    setIsTyping(true)

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat-LLM`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText.trim(),
          cartItems: cartItems,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const products = Array.isArray(data) ? data : []

        let assistantContent = ""
        if (products.length > 0) {
          assistantContent = `I found ${products.length} products that might interest you:`
        } else {
          assistantContent =
            "I understand your request, but I couldn't find any specific products right now. Could you try asking about a specific category or product type?"
        }

        const assistantMessage = {
          id: Date.now() + 1,
          type: "assistant",
          content: assistantContent,
          timestamp: new Date(),
          products: products.slice(0, 6), // Limit to 6 products
        }

        setMessages((prev) => [...prev, assistantMessage])

        if (autoSpeak) {
          speakText(assistantContent)
        }
      }
    } catch (error) {
      console.error("Error processing message:", error)
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      setIsTyping(false)
    }
  }

  // Text-to-speech
  const speakText = (text) => {
    if (!synthRef.current || !text.trim() || !autoSpeak) return

    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  // Voice controls
  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  // Clear chat
  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: "assistant",
        content: "Hi! I'm your AI shopping assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ])
    stopSpeaking()
  }

  // Handle product add to cart
  const handleAddToCart = (product) => {
    onAddToCart(product)

    const confirmationMessage = {
      id: Date.now(),
      type: "system",
      content: `✅ ${product.name} has been added to your cart for $${product.price}`,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, confirmationMessage])

    if (autoSpeak) {
      speakText(`Added ${product.name} to your cart`)
    }
  }

  // Product card component
  const ProductCard = ({ product }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow max-w-xs">
      <img
        src={product.image || `/placeholder.svg?height=120&width=120`}
        alt={product.name}
        className="w-full h-24 object-cover rounded-md mb-2"
      />
      <h4 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h4>
      {product.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-blue-600">${product.price}</span>
        {product.rating && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs text-gray-600">{product.rating}</span>
          </div>
        )}
      </div>
      <button
        onClick={() => handleAddToCart(product)}
        className="w-full flex items-center justify-center gap-1 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors text-sm"
      >
        <Plus className="w-3 h-3" />
        Add to Cart
      </button>
    </div>
  )

  // Message component
  const Message = ({ message }) => {
    const isUser = message.type === "user"
    const isSystem = message.type === "system"

    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
        <div className={`flex items-start gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : ""}`}>
          {/* Avatar */}
          <div
            className={`p-2 rounded-full flex-shrink-0 ${
              isUser ? "bg-blue-500" : isSystem ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            {isUser ? (
              <User className="w-4 h-4 text-white" />
            ) : isSystem ? (
              <ShoppingCart className="w-4 h-4 text-white" />
            ) : (
              <Bot className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Message content */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-blue-500 text-white"
                : isSystem
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>

            {/* Products grid */}
            {message.products && message.products.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {message.products.map((product, index) => (
                  <ProductCard key={`${message.id}-${index}`} product={product} />
                ))}
              </div>
            )}

            <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">AI Shopping Assistant</h2>
              <p className="text-sm opacity-90">{isTyping ? "Typing..." : "Online • Ready to help"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <VolumeX className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button onClick={clearChat} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="rounded"
                />
                Voice Input
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="rounded"
                />
                Auto-speak responses
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500 rounded-full">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice transcript */}
      {transcript && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <Mic className="w-4 h-4 inline mr-2" />
            Listening: "{transcript}"
          </p>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          {voiceEnabled && (
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`p-3 rounded-full transition-colors ${
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Type your message or use voice..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            {isProcessing && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isProcessing}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-center gap-4 mt-2">
          {isListening && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              Listening...
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Volume2 className="w-3 h-3" />
              Speaking...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIShoppingChat
