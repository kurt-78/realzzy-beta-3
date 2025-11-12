"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfileViewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-xl text-gray-600 dark:text-gray-300">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Profile Found
          </h2>
          <Link
            href="/profile/edit"
            className="inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-600"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {profile.first_name}
              </h1>
              {profile.age && (
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {profile.age} years old
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href="/profile/edit"
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {profile.sex && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Sex</p>
                <p className="text-lg text-gray-900 dark:text-white">{profile.sex}</p>
              </div>
            )}

            {(profile.looking_for_sex || profile.looking_for_relation_type) && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Looking For</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {profile.looking_for_sex} seeking {profile.looking_for_relation_type}
                </p>
              </div>
            )}

            {(profile.country || profile.state || profile.city || profile.zipcode) && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {[profile.city, profile.state, profile.country, profile.zipcode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            )}

            {profile.ethnicity && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Ethnicity</p>
                <p className="text-lg text-gray-900 dark:text-white">{profile.ethnicity}</p>
              </div>
            )}

            {profile.height && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Height</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {Math.floor(profile.height / 12)}'{profile.height % 12}" ({(profile.height * 2.54).toFixed(1)} cm)
                </p>
              </div>
            )}

            {profile.body_type && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Body Type</p>
                <p className="text-lg text-gray-900 dark:text-white">{profile.body_type}</p>
              </div>
            )}

            {profile.have_children && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Have Children</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {profile.have_children.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {profile.occupation && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Profession</p>
                <p className="text-lg text-gray-900 dark:text-white">{profile.occupation}</p>
              </div>
            )}

            {profile.smoke && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Smoking</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {profile.smoke.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {profile.drink && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Drinking</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {profile.drink.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {profile.drugs && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Drugs</p>
                <p className="text-lg text-gray-900 dark:text-white">
                  {profile.drugs.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {profile.religion && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Religion</p>
                <p className="text-lg text-gray-900 dark:text-white">{profile.religion}</p>
              </div>
            )}

            {profile.description && (
              <div className="pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">About Me</p>
                <p className="text-gray-900 dark:text-white leading-relaxed">
                  {profile.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}