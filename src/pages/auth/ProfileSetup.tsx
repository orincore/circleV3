import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/SupabaseClient";
import { useAuth } from "../../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { motion } from "framer-motion";
import { ChevronRight, Check, Upload, Trash2 } from "lucide-react";

// Expanded interests data with more categories
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

const genders = ["Male", "Female", "Other", "Prefer not to say"];
const preferences = ["Dating", "Friendship"];

function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multi-step form state
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Form states
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [preference, setPreference] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setUsername(user.user_metadata?.username || "");
      setFirstName(user.user_metadata?.first_name || "");
      setLastName(user.user_metadata?.last_name || "");
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      setProfilePictureUrl(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error("User not authenticated");

    try {
      // 1. Get presigned URL from backend
      const response = await fetch("https://circlebackendv1.onrender.com/api/profile/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          fileName: `profile-${Date.now()}.jpg`,
          fileType: file.type,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, publicUrl } = await response.json();

      // 2. Upload the file directly to S3 using the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      return publicUrl;
    } catch (error) {
      console.error("Profile picture upload error:", error);
      throw error;
    }
  };

  const deleteProfilePicture = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete profile picture");
      }

      setProfilePicture(null);
      setProfilePictureUrl("");
    } catch (error) {
      console.error("Delete profile picture error:", error);
      setError("Failed to remove profile picture");
    }
  };

  const calculateAge = (dateString: string) => {
    const dobDate = new Date(dateString);
    const diffMs = Date.now() - dobDate.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const renderInterests = (categoryIndex: number) => {
    const item = interestsData[categoryIndex];
    return (
      <div key={item.category} className="mb-6">
        <h3 className="font-semibold text-xl mb-3 text-gray-900 dark:text-gray-100">
          {item.category}
        </h3>
        <div className="flex flex-wrap gap-2">
          {item.subcategories.map((sub, index) => {
            const interestKey = `${item.category}: ${sub}`;
            const isSelected = selectedInterests.includes(interestKey);
            return (
              <motion.button
                key={index}
                type="button"
                onClick={() => toggleInterest(interestKey)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`px-4 py-2 rounded-full text-sm ${
                  isSelected
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {sub}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    return (
      <div className="flex items-center justify-between mb-8 px-4">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step > index + 1
                  ? "bg-primary-500 text-white"
                  : step === index + 1
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-500 border-2 border-primary-500"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
              }`}
            >
              {step > index + 1 ? <Check className="w-4 h-4" /> : index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`flex-1 h-1 ${
                  step > index + 1 ? "bg-primary-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              ></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return (
          username.trim() !== "" &&
          firstName.trim() !== "" &&
          lastName.trim() !== ""
        );
      case 2:
        return selectedInterests.length >= 3;
      case 3:
        return dob.trim() !== "" && gender.trim() !== "";
      case 4:
        return location.trim() !== "" && preference.trim() !== "";
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    setError("");
    if (validateStep()) {
      setStep((prev) => prev + 1);
    } else {
      switch (step) {
        case 1:
          setError("Please fill out username, first name, and last name.");
          break;
        case 2:
          setError("Please select at least 3 interests.");
          break;
        case 3:
          setError("Please select date of birth and gender.");
          break;
        case 4:
          setError("Please fill out location and preference.");
          break;
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      let profilePicturePublicUrl = "";
      if (profilePicture) {
        profilePicturePublicUrl = await uploadProfilePicture(profilePicture);
      }

      const profileData = {
        user_id: user?.id,
        username,
        first_name: firstName,
        last_name: lastName,
        profile_picture: profilePicturePublicUrl,
        interests: selectedInterests.join(", "),
        location,
        preference,
        age: calculateAge(dob),
        gender,
        bio,
        website,
        date_of_birth: dob,
      };

      const { error: supabaseError } = await supabase
        .from("user_profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (supabaseError) throw supabaseError;

      navigate("/home");
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      console.error("Profile setup error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-md mx-auto p-4">
        <div className="py-6">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-center text-gray-500 dark:text-gray-400">
            Tell us about yourself to get started
          </p>
        </div>

        {renderProgress()}

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Picture
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {profilePictureUrl ? (
                          <img
                            src={profilePictureUrl}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Upload className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={triggerFileInput}
                        className="rounded-full"
                      >
                        {profilePictureUrl ? "Change" : "Upload"}
                      </Button>
                      {profilePictureUrl && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={deleteProfilePicture}
                          className="rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Select Your Interests
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Choose at least 3 interests to help us match you with like-minded people
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {renderInterests(0)}
                {renderInterests(1)}
                {renderInterests(2)}
                {renderInterests(3)}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                About You
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Select gender</option>
                    {genders.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Location & Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="City, Country"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Looking for <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="preference"
                    value={preference}
                    onChange={(e) => setPreference(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="">Select preference</option>
                    {preferences.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Final Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    placeholder="Tell something interesting about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    name="website"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep((prev) => prev - 1)}
              className="rounded-full"
            >
              Back
            </Button>
          ) : (
            <div></div>
          )}

          <Button
            onClick={step === totalSteps ? handleSubmit : handleNextStep}
            className="rounded-full flex items-center"
            disabled={isSubmitting}
          >
            {step === totalSteps ? (
              isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                "Complete"
              )
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;
