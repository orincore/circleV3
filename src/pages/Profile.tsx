import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Grid,
  Bookmark,
  Users,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../components/AuthContext";
import { supabase } from "../lib/SupabaseClient";

// Data for custom interests editing
const interestsData = [
  {
    category: "Music",
    subcategories: ["Rock", "Pop", "Jazz", "Classical", "Hip-Hop", "EDM"],
  },
  {
    category: "Sports",
    subcategories: ["Football", "Basketball", "Tennis", "Cricket", "Baseball", "Running"],
  },
  {
    category: "Technology",
    subcategories: ["Programming", "Gadgets", "AI", "Gaming", "Robotics", "Blockchain"],
  },
  {
    category: "Art",
    subcategories: ["Painting", "Sculpture", "Photography", "Design", "Street Art", "Digital Art"],
  },
  {
    category: "Travel",
    subcategories: ["Adventure", "Cultural", "Luxury", "Budget", "Nature", "Road Trips"],
  },
  {
    category: "Food",
    subcategories: ["Cooking", "Baking", "Street Food", "Fine Dining", "Vegan", "Fusion"],
  },
  {
    category: "Movies",
    subcategories: ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Documentary"],
  },
  {
    category: "Books",
    subcategories: ["Fiction", "Non-Fiction", "Mystery", "Fantasy", "Biography", "Self-Help"],
  },
];

const tabs = [
  { id: "posts", icon: Grid, label: "Posts" },
  { id: "saved", icon: Bookmark, label: "Saved" },
  { id: "tagged", icon: Users, label: "Tagged" },
];

interface ExtendedProfile {
  interests?: string;
  location?: string;
  preference?: string;
  age?: number;
  gender?: string;
  bio?: string;
  website?: string;
  date_of_birth?: string;
  profile_picture?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export function Profile() {
  const { user, logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editTab, setEditTab] = useState<"personal" | "custom">("personal");
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [editBio, setEditBio] = useState("");
  const [editError, setEditError] = useState("");
  const [preference, setPreference] = useState<"Dating" | "Friendship">("Dating");

  // New states for personal details editing
  const [editUsername, setEditUsername] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");

  // New state for dark mode toggle
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Get profile picture URL - fallback to default if none exists
  const getProfilePictureUrl = () => {
    if (extendedProfile?.profile_picture) {
      return extendedProfile.profile_picture;
    }
    return "https://via.placeholder.com/80";
  };

  // Fetch extended profile from Supabase
  useEffect(() => {
    async function fetchExtendedProfile() {
      if (user?.id) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (!error && data) {
          setExtendedProfile(data);
          if (data.preference) {
            setPreference(data.preference as "Dating" | "Friendship");
          }
        }
        setLoadingProfile(false);
      }
    }
    fetchExtendedProfile();
  }, [user]);

  // Pre-populate custom interests and bio edit fields
  useEffect(() => {
    if (extendedProfile.interests) {
      setEditInterests(
        extendedProfile.interests.split(", ").filter((s) => s)
      );
    }
    if (extendedProfile.bio) {
      setEditBio(extendedProfile.bio);
    }
  }, [extendedProfile]);

  // Pre-populate personal details when modal is open and in personal tab
  useEffect(() => {
    if (isEditingProfile && editTab === "personal") {
      setEditUsername(extendedProfile.username || "");
      setEditFirstName(extendedProfile.first_name || "");
      setEditLastName(extendedProfile.last_name || "");
      setEditWebsite(extendedProfile.website || "");
    }
  }, [isEditingProfile, editTab, extendedProfile]);

  if (!user) return <div>Please sign in to view your profile.</div>;
  if (loadingProfile) return <div>Loading profile...</div>;

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
    }
  };

  const interestsArray = extendedProfile.interests
    ? extendedProfile.interests.split(", ").filter((s) => s)
    : [];

  const togglePreference = async () => {
    const newPreference = preference === "Dating" ? "Friendship" : "Dating";
    setPreference(newPreference);
    if (user?.id) {
      const { error } = await supabase
        .from("user_profiles")
        .update({ preference: newPreference })
        .eq("user_id", user.id);
      if (error) {
        console.error("Error updating preference:", error);
        setPreference(preference);
      }
    }
  };

  const toggleEditInterest = (interest: string) => {
    setEditInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  // Handler for updating interests and bio (custom tab)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editInterests.length < 3) {
      setEditError("Please select at least 3 interests.");
      return;
    }
    const { error } = await supabase
      .from("user_profiles")
      .update({
        interests: editInterests.join(", "),
        bio: editBio,
      })
      .eq("user_id", user.id);
    if (error) {
      setEditError(error.message);
    } else {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setExtendedProfile(data);
      setIsEditingProfile(false);
    }
  };

  // Handler for updating personal details (personal tab)
  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("user_profiles")
      .update({
        username: editUsername,
        first_name: editFirstName,
        last_name: editLastName,
        website: editWebsite,
      })
      .eq("user_id", user.id);
    if (error) {
      setEditError(error.message);
    } else {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) setExtendedProfile(data);
      setIsEditingProfile(false);
    }
  };

  // Combine first and last name for display
  const fullName =
    `${extendedProfile.first_name || ""} ${extendedProfile.last_name || ""}`.trim() ||
    "No Name Provided";

  return (
    // Root element gets dark class when dark mode is enabled.
    <div className={isDarkMode ? "dark" : ""}>
      <div className="pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header & Profile Info */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-4xl mx-auto p-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                @{extendedProfile.username || "User"}
              </h1>
              <div className="flex gap-2 mt-2">
                {/* Dark Mode Toggle Button */}
                <button
                  onClick={() => setIsDarkMode((prev) => !prev)}
                  className="px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm"
                >
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button
                variant="outline"
                onClick={handleEditProfile}
                className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-gray-700 px-4 py-2 text-sm md:text-base"
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500 px-4 py-2 text-sm md:text-base"
              >
                Logout
              </Button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-purple-600">
                <Settings className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto p-6 flex items-center gap-6">
            <img
              src={getProfilePictureUrl()}
              alt={extendedProfile.username || "User Avatar"}
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-100 dark:border-gray-600 shadow-lg"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {fullName}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {extendedProfile.bio || "No bio provided."}
              </p>
              {extendedProfile.website && (
                <a
                  href={extendedProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mt-2 inline-block"
                >
                  {extendedProfile.website}
                </a>
              )}
            </div>
          </div>

          {/* Additional Info & Preference Toggle */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-bold text-xl text-purple-600 dark:text-purple-300">
                    {extendedProfile.age || "-"}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Age</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-bold text-xl text-purple-600 dark:text-purple-300">
                    {extendedProfile.location || "-"}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Location</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-bold text-xl text-purple-600 dark:text-purple-300">
                    {extendedProfile.gender || "-"}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Gender</div>
                </div>
              </div>

              {/* Preference Toggle */}
              <div className="mt-4 flex justify-center items-center gap-4">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Looking for:</span>
                <button
                  onClick={togglePreference}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                    preference === "Dating" ? "bg-red-500" : "bg-purple-200"
                  }`}
                >
                  <span
                    className={`${
                      preference === "Dating" ? "translate-x-6" : "translate-x-1"
                    } inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200`}
                  />
                </button>
                <span
                  className={`font-semibold ${
                    preference === "Dating" ? "text-red-500" : "text-purple-600"
                  }`}
                >
                  {preference}
                </span>
              </div>

              {/* Interests */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {interestsArray.length > 0 ? (
                    interestsArray.map((interest, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-purple-100 dark:bg-purple-600 dark:text-white text-purple-700 rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No interests selected</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto flex border-t border-gray-100 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className="flex-1 py-4 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors relative group"
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-purple-50 dark:group-hover:bg-purple-800 transition-colors">
                  {tab.id === "posts" && (
                    <motion.div className="h-full bg-purple-600" layoutId="activeTab" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Posts */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={`https://source.unsplash.com/random/800x800/?sig=${index}`}
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h2>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={editTab === "personal" ? "primary" : "outline"}
                  onClick={() => setEditTab("personal")}
                  className="px-4 py-2 text-sm"
                >
                  Personal Details
                </Button>
                <Button
                  variant={editTab === "custom" ? "primary" : "outline"}
                  onClick={() => setEditTab("custom")}
                  className="px-4 py-2 text-sm"
                >
                  Interests & Bio
                </Button>
              </div>
            </div>

            <div className="p-6">
              {editTab === "personal" ? (
                <form onSubmit={handlePersonalSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="Your username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="Your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="Your last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email || ""}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website
                    </label>
                    <input
                      type="text"
                      value={editWebsite}
                      onChange={(e) => setEditWebsite(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="Your website URL"
                    />
                  </div>

                  {editError && (
                    <p className="text-red-600 text-sm">{editError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Select Interests
                    </h3>
                    <div className="grid gap-4">
                      {interestsData.map((item) => (
                        <div key={item.category} className="space-y-2">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300">
                            {item.category}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {item.subcategories.map((sub) => {
                              const interestKey = `${item.category}: ${sub}`;
                              const isSelected = editInterests.includes(interestKey);
                              return (
                                <button
                                  key={interestKey}
                                  type="button"
                                  onClick={() => toggleEditInterest(interestKey)}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                    isSelected
                                      ? "bg-purple-600 text-white"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                  }`}
                                >
                                  {sub}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-purple-500 dark:focus:border-purple-400"
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {editError && (
                    <p className="text-red-600 text-sm">{editError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Profile;
