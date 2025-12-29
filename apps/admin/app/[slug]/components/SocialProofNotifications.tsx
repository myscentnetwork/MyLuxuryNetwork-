"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

// Indian names and cities for realistic notifications
const INDIAN_NAMES = [
  "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohit", "Pooja",
  "Arjun", "Neha", "Karan", "Divya", "Sanjay", "Meera", "Aditya", "Kavya",
  "Raj", "Simran", "Varun", "Ananya", "Nikhil", "Riya", "Manish", "Shreya",
  "Akash", "Tanya", "Gaurav", "Nisha", "Sahil", "Kritika", "Vivek", "Swati"
];

const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
  "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Chandigarh", "Indore", "Nagpur",
  "Coimbatore", "Kochi", "Bhopal", "Vadodara", "Noida", "Gurgaon", "Thane"
];

// Avatar colors for visual variety
const AVATAR_COLORS = [
  "from-pink-500 to-rose-500",
  "from-purple-500 to-indigo-500",
  "from-blue-500 to-cyan-500",
  "from-teal-500 to-emerald-500",
  "from-amber-500 to-orange-500",
  "from-red-500 to-pink-500",
];

interface Product {
  id: string;
  name: string;
  images?: string[];
  category?: { name: string };
}

interface SocialProofNotificationsProps {
  products: Product[];
  currentProductId?: string;
}

type NotificationType = "purchase" | "favourite" | "viewing";

interface Notification {
  id: string;
  type: NotificationType;
  name: string;
  city: string;
  productName: string;
  productImage?: string;
  timeAgo: string;
  avatarColor: string;
}

export default function SocialProofNotifications({
  products,
  currentProductId
}: SocialProofNotificationsProps) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const getRandomItem = <T,>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
  };

  const getRandomTimeAgo = (): string => {
    const options = [
      "just now",
      "1 min ago",
      "2 mins ago",
      "3 mins ago",
      "5 mins ago",
    ];
    return getRandomItem(options);
  };

  const generateNotification = useCallback((): Notification => {
    const types: NotificationType[] = ["purchase", "favourite", "viewing"];
    const type = getRandomItem(types);

    // Prefer current product for relevance, but also show other products
    let product: Product;
    if (currentProductId && Math.random() > 0.4) {
      product = products.find(p => p.id === currentProductId) || getRandomItem(products);
    } else {
      product = getRandomItem(products);
    }

    return {
      id: Date.now().toString(),
      type,
      name: getRandomItem(INDIAN_NAMES),
      city: getRandomItem(INDIAN_CITIES),
      productName: product.name.length > 25
        ? product.name.substring(0, 25) + "..."
        : product.name,
      productImage: product.images?.[0],
      timeAgo: getRandomTimeAgo(),
      avatarColor: getRandomItem(AVATAR_COLORS),
    };
  }, [products, currentProductId]);

  const showNotification = useCallback(() => {
    if (products.length === 0) return;

    const newNotification = generateNotification();
    setNotification(newNotification);
    setIsVisible(true);

    // Hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [products, generateNotification]);

  useEffect(() => {
    if (products.length === 0) return;

    // Show first notification after 8-15 seconds
    const initialDelay = 8000 + Math.random() * 7000;
    const initialTimer = setTimeout(showNotification, initialDelay);

    // Then show notifications every 20-40 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 20000 + Math.random() * 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [products, showNotification]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case "purchase":
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "favourite":
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        );
      case "viewing":
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        );
    }
  };

  const getActionText = () => {
    switch (notification.type) {
      case "purchase":
        return "purchased";
      case "favourite":
        return "added to wishlist";
      case "viewing":
        return "is viewing";
    }
  };

  return (
    <div
      className={`fixed bottom-24 left-4 z-[150] transition-all duration-500 ease-out ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "-translate-x-[120%] opacity-0"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-100 overflow-hidden max-w-[320px]">
        {/* Main Content */}
        <div className="p-4">
          <div className="flex gap-3">
            {/* Product Image or Avatar */}
            <div className="relative flex-shrink-0">
              {notification.productImage ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-neutral-100">
                  <Image
                    src={notification.productImage}
                    alt={notification.productName}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${notification.avatarColor} flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">
                    {notification.name.charAt(0)}
                  </span>
                </div>
              )}
              {/* Action Icon Badge */}
              <div className="absolute -bottom-1 -right-1">
                {getIcon()}
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-semibold text-neutral-900">{notification.name}</span>
                <span className="text-neutral-500"> from </span>
                <span className="font-medium text-neutral-700">{notification.city}</span>
              </p>
              <p className="text-sm text-neutral-500 mt-0.5">
                {getActionText()}{" "}
                <span className="font-medium text-amber-600">{notification.productName}</span>
              </p>
              <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {notification.timeAgo}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500">
          <div
            className="h-full bg-white/30 transition-all ease-linear"
            style={{
              width: isVisible ? "0%" : "100%",
              transitionDuration: "5000ms"
            }}
          />
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-1 -right-1 w-3 h-3">
        <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
      </div>
    </div>
  );
}
