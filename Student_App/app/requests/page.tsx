"use client";

import { ArrowBigUp, ArrowBigDown, MessageCircle, Plus, Info, Edit2, Trash2 } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { useStudentStore } from "@/lib/store";
import { EmptyState } from "@/components/ui/EmptyState";

export default function RequestsPage() {
  const [activeTab, setActiveTab] = React.useState<"popular" | "recent">("popular");
  const { requests, voteRequest, addRequest } = useStudentStore();

  const handleVote = (id: string, currentVote: "up" | "down" | undefined, newVote: "up" | "down") => {
    if (currentVote === newVote) {
      voteRequest(id, null); // toggle off
    } else {
      voteRequest(id, newVote);
      toast.success(newVote === "up" ? "Upvoted!" : "Downvoted!");
    }
  };

  const handleAddRequest = () => {
    const title = window.prompt("Enter a title for your event idea:");
    if (!title) return;
    const description = window.prompt("Enter a short description:");
    if (!description) return;
    
    addRequest(title, description);
    toast.success("Request added!");
  };

  const sortedRequests = [...requests].sort((a, b) => {
    if (activeTab === "popular") {
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      return scoreB - scoreA;
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-24 md:pb-6 min-h-full">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-[var(--we-ink)]">Event Requests</h1>
          <div className="relative group">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Info className="w-5 h-5" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 p-3 bg-[var(--we-ink)] text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              Vote on event ideas proposed by the community or suggest your own. The most popular requests will be considered by Würth Elektronik.
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[var(--we-ink)] rotate-45" />
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleAddRequest}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--we-red)] text-white shadow-md hover:bg-red-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Segmented Control */}
      <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
        <button
          onClick={() => setActiveTab("popular")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "popular" ? "bg-white text-[var(--we-ink)] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Most Popular
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "recent" ? "bg-white text-[var(--we-ink)] shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Recent
        </button>
      </div>

      {/* Suggestion List */}
      <div className="space-y-4">
        {sortedRequests.length === 0 ? (
          <EmptyState 
            icon={MessageCircle}
            title="No requests yet"
            description="Be the first to suggest an event idea to Würth Elektronik."
            action={{
              label: "Suggest Event",
              onClick: handleAddRequest
            }}
          />
        ) : (
          sortedRequests.map((suggestion) => (
            <article key={suggestion.id} className={`flex gap-4 p-5 bg-white border ${suggestion.proposer_id === "me" ? "border-[var(--we-red)] shadow-sm relative overflow-hidden" : "border-gray-200"} rounded-2xl hover:border-gray-300 transition-colors`}>
              {suggestion.proposer_id === "me" && (
                <div className="absolute top-0 right-0 bg-[var(--we-red)] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                  Your Suggestion
                </div>
              )}
              {/* Vote Column */}
              <div className="flex flex-col items-center gap-1">
                <button 
                  onClick={() => handleVote(suggestion.id, suggestion.user_vote, "up")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    suggestion.user_vote === "up" ? "text-[var(--we-red)] bg-red-50" : "text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <ArrowBigUp className="w-6 h-6" />
                </button>
                <span className={`font-bold text-sm ${suggestion.user_vote === "up" ? "text-[var(--we-red)]" : "text-gray-700"}`}>
                  {suggestion.upvotes - suggestion.downvotes}
                </span>
                <button 
                  onClick={() => handleVote(suggestion.id, suggestion.user_vote, "down")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    suggestion.user_vote === "down" ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <ArrowBigDown className="w-6 h-6" />
                </button>
              </div>
              
              {/* Content Column */}
              <div className="flex-1 min-w-0 py-1">
                <h3 className="text-lg font-bold text-[var(--we-ink)] mb-2 leading-tight">
                  {suggestion.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {suggestion.description}
                </p>
                
                <div className="flex flex-wrap items-center justify-between mt-1">
                  <div className="flex items-center text-xs text-gray-400 gap-4">
                    <span>Posted {new Date(suggestion.created_at).toLocaleDateString()}</span>
                    <button 
                      onClick={() => toast("Discussion thread opened (Stub)")}
                      className="flex items-center hover:text-gray-600 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-1" />
                      Discuss
                    </button>
                  </div>
                  {suggestion.proposer_id === "me" && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toast.success("Edit suggestion opened")}
                        className="p-1.5 text-gray-400 hover:text-[var(--we-ink)] hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toast.success("Suggestion deleted")}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
