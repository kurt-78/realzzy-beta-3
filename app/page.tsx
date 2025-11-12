"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            💕 Dating App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find your perfect match
          </p>
        </div>

        {user ? (
          <div className="space-y-4 mt-8">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Welcome back! You're already logged in.
            </p>
            <Link
              href="/profile/view"
              className="block w-full py-4 px-6 text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
            >
              View Profile
            </Link>
            <Link
              href="/profile/edit"
              className="block w-full py-4 px-6 text-lg font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full py-4 px-6 text-lg font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-all"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-8">
            <Link
              href="/auth/signup"
              className="block w-full py-4 px-6 text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg"
            >
              Create Account
            </Link>

            <Link
              href="/auth/login"
              className="block w-full py-4 px-6 text-lg font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Log In
            </Link>
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}