import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/Button";
import { supabase } from "../lib/SupabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { useChatContext } from "../components/chat/ChatProvider";
import { useAuth } from "../components/AuthContext";

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
  user_id?: string;
}

const OtherUserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ExtendedProfile>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createOrGetChatRoom } = useChatContext();

  const getProfilePictureUrl = () => {
    return profile?.profile_picture || "https://via.placeholder.com/80";
  };

  useEffect(() => {
    async function fetchProfile() {
      if (userId) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (!error && data) {
          setProfile(data);
        } else {
          console.error("Error fetching profile:", error);
        }
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  const handleMessageClick = async () => {
    if (!user?.id || !profile.user_id) return;
    
    try {
      // Create or get existing chat room
      const roomId = await createOrGetChatRoom(user.id, profile.user_id);
      
      // Navigate to messages with the new chat
      navigate(`/messages?chat=${roomId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
      // Optionally show error to user
    }
  };

  if (loading) return <div>Loading profile...</div>;

  const fullName =
    `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
    "No Name Provided";

  return (
    <div className="pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-6">
            <img
              src={getProfilePictureUrl()}
              alt={profile.username || "User Avatar"}
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-100 dark:border-gray-600 shadow-lg"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {fullName}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {profile.bio || "No bio provided."}
              </p>
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mt-2 inline-block"
                >
                  {profile.website}
                </a>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                <div className="font-bold text-xl text-purple-600 dark:text-purple-300">
                  {profile.age || "-"}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Age
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                <div className="font-bold text-xl text-purple-600 dark:text-purple-300">
                  {profile.location || "-"}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Location
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
                <div className="font-bold text-xl text-purple-600 dark:text-purple-300">
                  {profile.gender || "-"}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Gender
                </div>
              </div>
            </div>

            {/* Interests */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests
                  ? profile.interests
                      .split(", ")
                      .filter((s) => s)
                      .map((interest, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-purple-100 dark:bg-purple-600 dark:text-white text-purple-700 rounded-full text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ))
                  : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No interests selected
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action - Message Button */}
      <div className="max-w-4xl mx-auto p-6 flex justify-center">
        <Button 
          variant="primary"
          onClick={handleMessageClick}
        >
          Message {profile.username || "User"}
        </Button>
      </div>
    </div>
  );
};

export default OtherUserProfile;