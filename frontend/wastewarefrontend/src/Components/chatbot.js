import React, { useState, useRef, useEffect, useContext, use } from "react";
import { useFetchWithAuth } from "./fetchWithAuth";
import { AuthContext } from "./AuthProvider";
import { useNavigate } from "react-router-dom";
import "../Styles/Component/chatbot.css";

const Chatbot = () => {
  // const { userData, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const fetchWithAuth = useFetchWithAuth();
  const [isOpen, setIsOpen] = useState(false);
  // console.log("Name: ", userData.name);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "👋 Hello! I'm the WasteWare assistant. How can I help you today?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies] = useState([
    "How do I submit a report?",
    "Find recycling centers",
    "How to earn points?",
    "Recycling tips",
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // useEffect(() => {
  //   if (!accessToken) {
  //     navigate("/login", { replace: true });
  //   }
  // })[(accessToken, navigate)];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message = null) => {
    const messageToSend = message ?? inputValue.trim();
    if (!messageToSend) return;

    setInputValue("");
    setMessages((prev) => [...prev, { type: "user", text: messageToSend }]);
    setIsLoading(true);

    try {
      const response = await fetchWithAuth(
        "http://localhost:8000/api/chatbot/chat/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageToSend }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { type: "bot", text: data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Sorry, I'm having trouble responding. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Chatbot request error:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, something went wrong. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        className={`chatbot-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? (
          <i className="fa-solid fa-times" aria-hidden="true"></i>
        ) : (
          <i className="fa-solid fa-comment" aria-hidden="true"></i>
        )}
      </button>

      {isOpen && (
        <div className="chatbot-container" role="dialog" aria-modal="false">
          <div className="chatbot-header">
            <i className="fa-solid fa-robot" aria-hidden="true"></i>
            <span>WasteWare Assistant</span>

            {/* Close button in header */}
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.type === "bot" && (
                  <div className="bot-avatar">
                    <i className="fa-solid fa-robot" aria-hidden="true"></i>
                  </div>
                )}
                <div className="message-content">{msg.text}</div>
              </div>
            ))}

            {isLoading && (
              <div className="message bot">
                <div className="bot-avatar">
                  <i className="fa-solid fa-robot" aria-hidden="true"></i>
                </div>
                <div className="message-content typing" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-quick-replies">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                className="quick-reply-btn"
                onClick={() => handleSendMessage(reply)}
                disabled={isLoading}
                type="button"
              >
                {reply}
              </button>
            ))}
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              aria-label="Message input"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
              type="button"
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
