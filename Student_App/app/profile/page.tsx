"use client";

import { useState } from "react";
import { Settings, LogOut, ChevronRight, ChevronDown, Award, Info, X, Bell, Mail, Shield, Smartphone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useStudentStore } from "@/lib/store";

const INTEREST_TAXONOMY = [
  { category: "Hardware & Core Engineering", tags: ["PCB Design", "Embedded Systems", "EMC", "Power Electronics"] },
  { category: "Industrial & Manufacturing Tech", tags: ["Industrial Automation", "Smart Factory", "Robotics"] },
  { category: "Technical Business & Customer Support", tags: ["Technical Sales", "Product Management"] },
];

export default function ProfilePage() {
  const { userProfile, toggleInterest, memories, userInteractions, updateProfile } = useStudentStore();
  const { name, email, university, degree, selectedInterests } = userProfile;
  const [showAllMemories, setShowAllMemories] = useState(false);
  const [showAllAttended, setShowAllAttended] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  const myMemories = Object.values(memories).flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const displayedMemories = showAllMemories ? myMemories : myMemories.slice(0, 3);

  const handleToggle = (tag: string) => {
    toggleInterest(tag);
    toast(`Interest '${tag}' updated`);
  };

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8 min-h-full">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[var(--we-ink)]">Profile</h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-6 h-6 text-gray-600" />
        </button>
      </header>

      {/* User Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--we-red)]/5 rounded-bl-full -z-10" />
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-red-50 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0">
          <span className="text-3xl font-bold text-[var(--we-red)]">{getInitials(name)}</span>
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-[var(--we-ink)]">{name}</h2>
          <p className="text-gray-500 mb-2">{email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            {university && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                {university}
              </span>
            )}
            {degree && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                {degree}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interests Section */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-[var(--we-ink)]">Interest Areas</h3>
          <div className="relative group">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Info className="w-4 h-4" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-56 p-3 bg-[var(--we-ink)] text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Select topics you&apos;re interested in to get better event recommendations.
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--we-ink)] rotate-45" />
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {INTEREST_TAXONOMY.map(group => (
            <div key={group.category}>
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{group.category}</h4>
              <div className="flex flex-wrap gap-2">
                {group.tags.map(tag => {
                  const isSelected = selectedInterests.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => handleToggle(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isSelected 
                          ? "bg-[var(--we-red)] text-white shadow-md shadow-red-500/20" 
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Attended Events Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--we-ink)]">
            Attended Events
            {userInteractions.checkedInEvents.length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-2">({userInteractions.checkedInEvents.length})</span>
            )}
          </h3>
          {userInteractions.checkedInEvents.length > 2 && (
            <button 
              onClick={() => setShowAllAttended(!showAllAttended)}
              className="text-sm font-medium text-[var(--we-red)] hover:text-red-700 transition-colors flex items-center"
            >
              {showAllAttended ? (
                <>Show Less <ChevronDown className="w-4 h-4 ml-1" /></>
              ) : (
                <>View All <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          )}
        </div>
        
        {userInteractions.checkedInEvents.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">No events attended yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAllAttended ? userInteractions.checkedInEvents : userInteractions.checkedInEvents.slice(0, 2)).map((eventId, idx) => {
              // Mock title generator based on ID
              const mockTitles = ["Seminartag Waldenburg", "Power Supply Workshop", "EMC Study Group", "IKOM TU München", "Networking Event Munich"];
              const mockTitle = mockTitles[(parseInt(eventId) || idx) % mockTitles.length];
              
              return (
                <div key={eventId} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[var(--we-red)]">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[var(--we-ink)]">{mockTitle}</p>
                      <p className="text-xs text-gray-500">ID: {eventId} • Attended</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Memories / Activity Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--we-ink)]">
            My Memories
            {myMemories.length > 0 && (
              <span className="text-sm font-normal text-gray-400 ml-2">({myMemories.length})</span>
            )}
          </h3>
          {myMemories.length > 3 && (
            <button 
              onClick={() => setShowAllMemories(!showAllMemories)}
              className="text-sm font-medium text-[var(--we-red)] hover:text-red-700 transition-colors flex items-center"
            >
              {showAllMemories ? (
                <>Show Less <ChevronDown className="w-4 h-4 ml-1" /></>
              ) : (
                <>View All <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </button>
          )}
        </div>
        
        {myMemories.length === 0 ? (
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
            <Award className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No public memories yet.</p>
            <p className="text-sm text-gray-400 mt-1">Attend an event and share your experience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedMemories.map((memory) => (
              <div key={memory.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <span className="font-bold text-gray-500">{getInitials(name)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-[var(--we-ink)]">{userProfile.name}</span>
                    <span className="text-xs text-gray-400">{new Date(memory.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-2">{memory.content}</p>
                  {memory.image_url && (
                    <div className="relative h-32 w-full rounded-xl overflow-hidden mt-2">
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
            ))}
            {!showAllMemories && myMemories.length > 3 && (
              <button 
                onClick={() => setShowAllMemories(true)}
                className="w-full py-3 text-center text-sm font-medium text-[var(--we-red)] bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                Show {myMemories.length - 3} more memories
              </button>
            )}
          </div>
        )}
      </section>

      {/* Logout */}
      <button 
        onClick={() => toast.success("Signed out successfully (Stub)")}
        className="w-full flex items-center justify-center p-4 rounded-xl text-[var(--we-red)] font-bold hover:bg-red-50 transition-colors mt-12 border border-transparent hover:border-red-100"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Sign Out
      </button>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold text-[var(--we-ink)]">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Account Settings */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Account</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--we-ink)]">Hometown</label>
                      <input 
                        type="text" 
                        value={userProfile.hometown || ""} 
                        onChange={(e) => updateProfile({ hometown: e.target.value })}
                        placeholder="e.g. Munich"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--we-red)] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--we-ink)]">University</label>
                      <input 
                        type="text" 
                        value={userProfile.university || ""} 
                        onChange={(e) => updateProfile({ university: e.target.value })}
                        placeholder="e.g. TUM"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--we-red)] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--we-ink)]">Degree</label>
                      <input 
                        type="text" 
                        value={userProfile.degree || ""} 
                        onChange={(e) => updateProfile({ degree: e.target.value })}
                        placeholder="e.g. B.Sc. Computer Science"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[var(--we-red)] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications Settings */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[var(--we-red)]">
                          <Bell className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--we-ink)]">Push Notifications</p>
                          <p className="text-xs text-gray-500">Event updates & messages</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setNotifications(!notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--we-red)] focus:ring-offset-2 ${notifications ? 'bg-[var(--we-red)]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-[var(--we-red)]">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--we-ink)]">Email Newsletter</p>
                          <p className="text-xs text-gray-500">Career tips & WE news</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setEmailUpdates(!emailUpdates)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--we-red)] focus:ring-offset-2 ${emailUpdates ? 'bg-[var(--we-red)]' : 'bg-gray-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailUpdates ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Privacy & Legal */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Legal</h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-600">
                      <Shield className="w-4 h-4 text-gray-400" />
                      Privacy Policy
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left text-sm font-medium text-gray-600">
                      <Info className="w-4 h-4 text-gray-400" />
                      Terms of Service
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button 
                onClick={() => {
                  setShowSettings(false);
                  toast.success("Settings saved successfully.");
                }}
                className="w-full py-3 bg-[var(--we-ink)] text-white rounded-xl font-bold shadow-md shadow-gray-900/10 hover:bg-gray-800 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

