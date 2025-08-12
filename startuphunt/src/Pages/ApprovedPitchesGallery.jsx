import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Play } from "lucide-react";

function ApprovedPitchVideoPlayer({ filePath }) {
  if (!filePath) return null;
  return (
    <video controls className="w-full rounded-lg mt-2">
      <source src={filePath} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
}

export default function ApprovedPitchesGallery() {
  const [approvedPitches, setApprovedPitches] = useState([]);
  const [loadingApprovedPitches, setLoadingApprovedPitches] = useState(true);

  const fetchApprovedPitches = async () => {
    setLoadingApprovedPitches(true);
    try {
      const { data: pitchesData, error: pitchesError } = await supabase
        .from("pitch_submissions")
        .select(
          `*,projects:project_id (
            id, 
            name, 
            tagline, 
            logo_url,
            user_id
          )`
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (pitchesError) {
        setApprovedPitches([]);
        return;
      }
      if (pitchesData && pitchesData.length > 0) {
        const userIds = [...new Set(pitchesData.map((p) => p.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        const profilesMap = {};
        profilesData?.forEach((profile) => {
          profilesMap[profile.id] = profile;
        });
        const combinedData = pitchesData.map((pitch) => ({
          ...pitch,
          profiles: profilesMap[pitch.user_id],
        }));
        setApprovedPitches(combinedData);
      } else {
        setApprovedPitches([]);
      }
    } catch (err) {
      setApprovedPitches([]);
    } finally {
      setLoadingApprovedPitches(false);
    }
  };

  useEffect(() => {
    fetchApprovedPitches();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen py-16 bg-gradient-to-br from-emerald-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            🎬 Approved Pitches
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Watch inspiring pitches from other founders
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white opacity-10"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎬</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Approved Pitches
                </h2>
                <p className="text-emerald-100 text-sm">
                  Watch inspiring pitches from other founders
                </p>
              </div>
            </div>
          </div>
          {loadingApprovedPitches ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading approved pitches...</p>
            </div>
          ) : approvedPitches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No approved pitches yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {approvedPitches.map((pitch) => (
                <div
                  key={pitch.id}
                  className="bg-gray-50 rounded-lg overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {pitch.projects?.logo_url && (
                        <img
                          src={pitch.projects.logo_url}
                          alt="Project logo"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {pitch.title || "Untitled Pitch"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          by {pitch.profiles?.full_name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      <strong>Project:</strong> {pitch.projects?.name}
                    </p>
                    {pitch.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {pitch.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(pitch.created_at).toLocaleDateString()}
                      </span>
                      {pitch.video_type === "file" ? (
                        <ApprovedPitchVideoPlayer filePath={pitch.video_url} />
                      ) : (
                        <a
                          href={pitch.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Watch
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
