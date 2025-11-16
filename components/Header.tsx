"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import toast from "react-hot-toast";

export default function Header() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsLoggedIn(true);
        
        // Get user's profile name
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.first_name) {
          setUserName(profile.first_name);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    setIsLoggedIn(false);
    setUserName(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 cursor-pointer">
              Realzzy
            </h1>
          </Link>

          {/* Navigation */}
          {!loading && (
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  {/* Notification Bell */}
                  <NotificationBell />
                  
                  {/* Browse Profiles */}
                  <Link
                    href="/"
                    className="text-gray-700 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 font-medium transition-colors"
                  >
                    Browse
                  </Link>

                  {/* My Profile */}
                  <Link
                    href="/profile/view"
                    className="text-gray-700 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 font-medium transition-colors"
                  >
                    My Profile
                  </Link>

                  {/* Username Display */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Hi, {userName || "User"}!
                    </span>
                    
                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-pink-500 dark:hover:text-pink-400 font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-pink-500 dark:hover:text-pink-400 font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
