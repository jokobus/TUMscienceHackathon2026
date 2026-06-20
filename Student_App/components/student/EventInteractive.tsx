"use client";

import { useState } from "react";
import { Share2, Send } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Event } from "@/lib/types";
import { useStudentStore } from "@/lib/store";

export function EventInteractive({ event, isPast }: { event: Event; isPast: boolean }) {
  const [activeTab, setActiveTab] = useState<"info" | "files" | "memory">("info");
  const [memoryText, setMemoryText] = useState("");
  const { userInteractions, toggleApplyToEvent, memories, postMemory, userProfile, checkInToEvent } = useStudentStore();

  const isApplied = userInteractions.appliedEvents.includes(event.id);
  const hasAttended = userInteractions.checkedInEvents.includes(event.id);
  const eventMemories = memories[event.id] || [];

  const now = new Date();
  const eventStart = parseISO(event.start_at);
  const isStarted = now >= eventStart || isPast;

  // Mock files for demonstration (always available for demo purposes)
  const mockFiles = [
    { name: "Presentation_Slides.pdf", size: "4.2 MB", type: "pdf" },
    { name: "Event_Material.zip", size: "12.5 MB", type: "zip" }
  ];
  const hasFiles = mockFiles.length > 0;

  const showFileDrive = hasFiles && isStarted && hasAttended;
  const showMemoryTab = isStarted && hasAttended;

  const handleToggleApply = () => {
    toggleApplyToEvent(event.id);
    if (isApplied) {
      toast("Registration cancelled.");
    } else {
      toast.success(event.application_required ? "Application Submitted!" : "Registered successfully!");
    }
  };

  const handlePostMemory = () => {
    if (!memoryText.trim()) return;
    postMemory(event.id, memoryText);
    setMemoryText("");
    toast.success("Memory posted!");
  };

  // Generate fake but deterministic registration data from event id
  const seed = parseInt(event.id, 10) || 1;
  const totalSpots = 20 + (seed * 7) % 80;
  const registered = Math.min(totalSpots - 1, 5 + (seed * 13) % (totalSpots - 3));
  const spotsLeft = totalSpots - registered;

  // Fake deadline: 3 days before event start
  const startDate = parseISO(event.start_at);
  const deadlineDate = new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000);

  return (
    <>
      {/* Custom Tabs (Segmented Control) */}
      <div className="mb-8 overflow-x-auto no-scrollbar">
        <div className="flex space-x-2 border-b border-gray-200 pb-px min-w-max">
          <button 
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "info" ? "border-[var(--we-red)] text-[var(--we-red)]" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Information
          </button>
          {showFileDrive && (
            <button 
              onClick={() => setActiveTab("files")}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "files" ? "border-[var(--we-red)] text-[var(--we-red)]" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              File Drive
            </button>
          )}
          {showMemoryTab && (
            <button 
              onClick={() => setActiveTab("memory")}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "memory" ? "border-[var(--we-red)] text-[var(--we-red)]" : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Capture a Memory
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="prose prose-gray max-w-none">
        {activeTab === "info" && (
          <>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
              {event.description || "No detailed description provided for this event."}
            </p>

            {/* Registration Info Box */}
            {!isPast && (
              <div className="mt-8 bg-gray-50 rounded-2xl p-5 border border-gray-200 not-prose">
                <h4 className="font-bold text-[var(--we-ink)] mb-3 text-sm uppercase tracking-wider">Registration Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Spots</span>
                    <span className="font-bold text-[var(--we-ink)]">{registered + (isApplied ? 1 : 0)} / {totalSpots}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Spots Left</span>
                    <span className={`font-bold ${spotsLeft <= 5 ? "text-orange-600" : "text-green-600"}`}>
                      {spotsLeft - (isApplied ? 1 : 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Deadline</span>
                    <span className="font-bold text-[var(--we-ink)]">{format(deadlineDate, "MMM d, yyyy")}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Format</span>
                    <span className="font-bold text-[var(--we-ink)]">{event.type === "hackathon" ? "In-Person" : seed % 3 === 0 ? "Hybrid" : "In-Person"}</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[var(--we-red)] h-2 rounded-full transition-all" 
                    style={{ width: `${Math.min(100, ((registered + (isApplied ? 1 : 0)) / totalSpots) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Action Area */}
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between not-prose">
              <div>
                {event.application_required && !isPast && (
                  <div className="text-sm text-gray-500 mb-2">
                    Application required • Closes {format(deadlineDate, "MMM d")}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                
                {isStarted && !hasAttended && (
                  <button 
                    onClick={() => {
                      checkInToEvent(event.id);
                      toast.success("Checked in! You now have access to files and memory.");
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 border border-[var(--we-red)] text-[var(--we-red)] rounded-xl font-bold hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Check In (Mock)
                  </button>
                )}
                
                {!isPast ? (
                  <button 
                    onClick={handleToggleApply}
                    className={`flex-1 sm:flex-none flex items-center justify-center px-8 py-3 rounded-xl font-medium transition-all shadow-sm ${
                      isApplied 
                        ? "bg-green-100 text-green-800 hover:bg-red-50 hover:text-red-700 border border-green-200 hover:border-red-200"
                        : "bg-[var(--we-ink)] text-white hover:bg-gray-800"
                    }`}
                  >
                    {isApplied 
                      ? (event.application_required ? "Application Submitted ✓" : "Registered ✓")
                      : (event.application_required ? "Submit Application" : "Register Now")}
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      toast.success("Event added to suggestions!");
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center px-8 py-3 rounded-xl font-medium transition-all shadow-sm bg-[var(--we-ink)] text-white hover:bg-gray-800"
                  >
                    Suggest Again
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        
        {activeTab === "files" && (
          <div className="space-y-4 mt-6">
            {mockFiles.map((file, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[var(--we-red)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--we-ink)]">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size} • {file.type.toUpperCase()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toast.success(`Downloading ${file.name}...`)}
                  className="px-4 py-2 text-sm font-bold text-[var(--we-red)] hover:bg-red-50 rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "memory" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-3">
                <input 
                  type="text"
                  value={memoryText}
                  onChange={(e) => setMemoryText(e.target.value)}
                  placeholder="Share your experience..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handlePostMemory()}
                />
                <button 
                  onClick={() => {
                    const url = window.prompt("Enter image URL or leave blank for a random tech placeholder:", "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80");
                    if (url) {
                      postMemory(event.id, memoryText || "Shared a photo!", url);
                      setMemoryText("");
                      toast.success("Photo posted!");
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 hover:bg-gray-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                </button>
                <button 
                  onClick={handlePostMemory}
                  className="w-10 h-10 rounded-full bg-[var(--we-red)] flex items-center justify-center text-white shrink-0 hover:bg-red-700 transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              {eventMemories.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Be the first to share a memory!</p>
              ) : (
                eventMemories.map(memory => (
                  <div key={memory.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <span className="font-bold text-gray-500">{userProfile.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-[var(--we-ink)]">{userProfile.name}</span>
                        <span className="text-xs text-gray-400">{new Date(memory.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-2">{memory.content}</p>
                      {memory.image_url && (
                        <div className="relative h-48 w-full rounded-xl overflow-hidden mt-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={memory.image_url} 
                            alt="Memory attachment" 
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
