"use client";

import { MessageSquare, Users, Search, Send, ArrowLeft, Briefcase } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useState } from "react";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
}

interface Chat {
  id: string;
  name: string;
  type: "event_channel" | "dm" | "group";
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isActive: boolean;
  messages: ChatMessage[];
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "Seminartag Waldenburg 2026",
    type: "event_channel",
    avatar: "SW",
    lastMessage: "The lab tour will start in 10 minutes at the main entrance.",
    time: "10:45 AM",
    unread: 3,
    isActive: true,
    messages: [
      { id: "1a", sender: "Dr. Müller", content: "Welcome everyone to the Seminartag Waldenburg 2026! We're excited to have you here.", time: "9:00 AM", isMe: false },
      { id: "1b", sender: "You", content: "Thank you! Looking forward to the EMC lab tour 🎉", time: "9:05 AM", isMe: true },
      { id: "1c", sender: "Anna K.", content: "Is the parking lot behind Building A?", time: "9:12 AM", isMe: false },
      { id: "1d", sender: "Dr. Müller", content: "Yes, Building A parking is open. You can also use the visitor parking near the main gate.", time: "9:15 AM", isMe: false },
      { id: "1e", sender: "Jonas B.", content: "Can we take photos inside the EMC lab?", time: "10:30 AM", isMe: false },
      { id: "1f", sender: "Dr. Müller", content: "The lab tour will start in 10 minutes at the main entrance.", time: "10:45 AM", isMe: false },
    ],
  },
  {
    id: "2",
    name: "IKOM TU München",
    type: "event_channel",
    avatar: "IK",
    lastMessage: "Remember to bring your updated CV to the booth!",
    time: "Yesterday",
    unread: 1,
    isActive: true,
    messages: [
      { id: "2a", sender: "WE Recruiting", content: "Hi everyone! Würth Elektronik will be at Booth 42. Come say hi!", time: "Mon", isMe: false },
      { id: "2b", sender: "You", content: "Awesome, I'll stop by. Are there any open positions for EE interns?", time: "Mon", isMe: true },
      { id: "2c", sender: "WE Recruiting", content: "Absolutely! We have openings in PCB Design and EMC Testing. Bring your CV!", time: "Mon", isMe: false },
      { id: "2d", sender: "Lisa M.", content: "I just had a great conversation at the booth. Highly recommend!", time: "Tue", isMe: false },
      { id: "2e", sender: "WE Recruiting", content: "Remember to bring your updated CV to the booth!", time: "Yesterday", isMe: false },
    ],
  },
  {
    id: "3",
    name: "Michael Schneider",
    type: "dm",
    avatar: "MS",
    lastMessage: "Thanks for the chat at the career booth!",
    time: "Yesterday",
    unread: 0,
    isActive: false,
    messages: [
      { id: "3a", sender: "Michael Schneider", content: "Hey! It was great meeting you at the IKOM booth today.", time: "Tue 3:15 PM", isMe: false },
      { id: "3b", sender: "You", content: "Likewise! The power electronics talk was really insightful.", time: "Tue 3:20 PM", isMe: true },
      { id: "3c", sender: "Michael Schneider", content: "Agreed. I've been working on a similar topology at WE. Would love to connect on LinkedIn.", time: "Tue 3:25 PM", isMe: false },
      { id: "3d", sender: "You", content: "Absolutely, just sent you a request!", time: "Tue 3:30 PM", isMe: true },
      { id: "3e", sender: "Michael Schneider", content: "Thanks for the chat at the career booth!", time: "Yesterday", isMe: false },
    ],
  },
  {
    id: "4",
    name: "Sarah Weber",
    type: "dm",
    avatar: "SV",
    lastMessage: "Sure, I'll send you the presentation slides.",
    time: "Mon",
    unread: 0,
    isActive: false,
    messages: [
      { id: "4a", sender: "You", content: "Hi Sarah, could you share the slides from the EMC seminar?", time: "Mon 2:00 PM", isMe: true },
      { id: "4b", sender: "Sarah Weber", content: "Sure, I'll send you the presentation slides.", time: "Mon 2:15 PM", isMe: false },
    ],
  },
  {
    id: "5",
    name: "Power Supply Workshop",
    type: "event_channel",
    avatar: "PS",
    lastMessage: "Don't forget: Discount code WURTH10 for 10% off!",
    time: "Mon",
    unread: 0,
    isActive: false,
    messages: [
      { id: "5a", sender: "Workshop Team", content: "Welcome to the Power Supply Hardware Design Workshop channel!", time: "Sat", isMe: false },
      { id: "5b", sender: "Workshop Team", content: "We'll be covering flyback, forward, and half-bridge topologies.", time: "Sat", isMe: false },
      { id: "5c", sender: "You", content: "Will we cover thermal management for WE-MAPI inductors?", time: "Sun", isMe: true },
      { id: "5d", sender: "Workshop Team", content: "Yes! That's in Session 3 on Tuesday.", time: "Sun", isMe: false },
      { id: "5e", sender: "Workshop Team", content: "Don't forget: Discount code WURTH10 for 10% off!", time: "Mon", isMe: false },
    ],
  },
  {
    id: "6",
    name: "Thomas Becker",
    type: "dm",
    avatar: "TB",
    lastMessage: "See you at the electronica in November!",
    time: "Jun 15",
    unread: 0,
    isActive: false,
    messages: [
      { id: "6a", sender: "Thomas Becker", content: "Hey, are you going to electronica this year?", time: "Jun 14", isMe: false },
      { id: "6b", sender: "You", content: "Yes! Already registered. Will WE have a booth?", time: "Jun 14", isMe: true },
      { id: "6c", sender: "Thomas Becker", content: "Definitely, Hall A2. We'll demo the new WE-MAPI series.", time: "Jun 15", isMe: false },
      { id: "6d", sender: "Thomas Becker", content: "See you at the electronica in November!", time: "Jun 15", isMe: false },
    ],
  },
  {
    id: "7",
    name: "EMC Study Group",
    type: "group",
    avatar: "EM",
    lastMessage: "Has anyone solved the differential mode noise problem from Lab 3?",
    time: "Jun 14",
    unread: 5,
    isActive: false,
    messages: [
      { id: "7a", sender: "Felix R.", content: "Does anyone have good resources on near-field EMC probing?", time: "Jun 13", isMe: false },
      { id: "7b", sender: "You", content: "Check the WE YouTube channel, they have a great series on it.", time: "Jun 13", isMe: true },
      { id: "7c", sender: "Julia H.", content: "Thanks! Those videos are really helpful.", time: "Jun 14", isMe: false },
      { id: "7d", sender: "Felix R.", content: "Has anyone solved the differential mode noise problem from Lab 3?", time: "Jun 14", isMe: false },
    ],
  },
  {
    id: "8",
    name: "Recruiter – WE Karriere",
    type: "dm",
    avatar: "WE",
    lastMessage: "We'd love to invite you for a technical interview. When are you available?",
    time: "Jun 12",
    unread: 1,
    isActive: false,
    messages: [
      { id: "8a", sender: "WE Karriere", content: "Hi Jane! We noticed your profile and interest in PCB Design. We have a working student position open.", time: "Jun 10", isMe: false },
      { id: "8b", sender: "You", content: "That sounds very interesting! Could you tell me more about the role?", time: "Jun 10", isMe: true },
      { id: "8c", sender: "WE Karriere", content: "It's a 20h/week position in our Waldenburg R&D lab. You'd work on high-frequency PCB layout for our new inductor series.", time: "Jun 11", isMe: false },
      { id: "8d", sender: "You", content: "That's exactly what I'm studying! I'd love to learn more.", time: "Jun 11", isMe: true },
      { id: "8e", sender: "WE Karriere", content: "We'd love to invite you for a technical interview. When are you available?", time: "Jun 12", isMe: false },
    ],
  },
];

export default function ChatPage() {
  const [filter, setFilter] = useState("");
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [localChats, setLocalChats] = useState(mockChats);

  const filteredChats = localChats.filter(c => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q) ||
      c.messages.some(m => m.content.toLowerCase().includes(q))
    );
  });

  const activeChats = filteredChats.filter(c => c.isActive);
  const dmChats = filteredChats.filter(c => !c.isActive && c.type === "dm");
  const groupChats = filteredChats.filter(c => !c.isActive && (c.type === "event_channel" || c.type === "group"));

  const openChat = localChats.find(c => c.id === openChatId);

  const handleOpenChat = (id: string) => {
    setOpenChatId(id);
    setLocalChats(prev => prev.map(chat => 
      chat.id === id ? { ...chat, unread: 0 } : chat
    ));
  };

  const handleSend = () => {
    if (!inputText.trim() || !openChatId) return;
    setLocalChats(prev => prev.map(chat => {
      if (chat.id !== openChatId) return chat;
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: "You",
        content: inputText,
        time: "Just now",
        isMe: true,
      };
      return {
        ...chat,
        lastMessage: inputText,
        time: "Just now",
        unread: 0,
        messages: [...chat.messages, newMsg],
      };
    }));
    setInputText("");
  };

  // Chat detail view
  if (openChat) {
    return (
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
        {/* Chat Header */}
        <header className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3 z-10 shrink-0">
          <button 
            onClick={() => { setOpenChatId(null); }}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            openChat.type === "event_channel" ? "bg-red-100 text-[var(--we-red)]" : openChat.type === "group" ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"
          }`}>
            {openChat.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-[var(--we-ink)] truncate">{openChat.name}</p>
            <p className="text-xs text-gray-400">
              {openChat.type === "event_channel" ? "Event Channel" : openChat.type === "group" ? "Group" : "Direct Message"}
              {openChat.isActive && " • 🟢 Live"}
            </p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          {openChat.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                msg.isMe 
                  ? "bg-[var(--we-ink)] text-white rounded-br-md" 
                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm"
              }`}>
                {!msg.isMe && (
                  <p className={`text-xs font-bold mb-1 ${openChat.type === "event_channel" ? "text-[var(--we-red)]" : "text-indigo-600"}`}>
                    {msg.sender}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.isMe ? "text-gray-400" : "text-gray-400"}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0 pb-safe">
          <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={handleSend}
              className="w-9 h-9 rounded-full bg-[var(--we-red)] flex items-center justify-center text-white shrink-0 hover:bg-red-700 transition-colors"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat list view
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="px-4 pt-6 pb-4 bg-white z-10 shrink-0">
        <h1 className="text-3xl font-bold text-[var(--we-ink)] mb-4">Messages</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search people and events..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[var(--we-red)] focus:border-transparent sm:text-sm transition-all"
          />
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        {activeChats.length === 0 && groupChats.length === 0 && dmChats.length === 0 && (
          <EmptyState 
            icon={MessageSquare}
            title="No messages found"
            description="We couldn't find any chats matching your search. Try different keywords or check your spelling."
            action={filter ? {
              label: "Clear Search",
              onClick: () => setFilter("")
            } : undefined}
          />
        )}

        {/* Live Channels */}
        {activeChats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">🟢 Live Channels</h2>
            <div className="space-y-2">
              {activeChats.map(chat => (
                <button key={chat.id} onClick={() => handleOpenChat(chat.id)} className="block w-full text-left">
                  <div className="flex items-center p-3 rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[var(--we-red)] font-bold text-sm">
                      {chat.avatar}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-red-900 truncate">{chat.name}</p>
                        <p className="text-xs font-medium text-red-600 shrink-0 ml-2">{chat.time}</p>
                      </div>
                      <p className="text-sm text-red-700 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="ml-2 w-5 h-5 bg-[var(--we-red)] rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Groups / Event Channels (inactive) */}
        {groupChats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Groups & Events</h2>
            <div className="space-y-1">
              {groupChats.map(chat => (
                <button key={chat.id} onClick={() => handleOpenChat(chat.id)} className="block w-full text-left">
                  <div className="flex items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold ${
                      chat.type === "group" ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {chat.avatar}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[var(--we-ink)] truncate">{chat.name}</p>
                        <p className="text-xs text-gray-400 shrink-0 ml-2">{chat.time}</p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="ml-2 w-5 h-5 bg-[var(--we-red)] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direct Messages */}
        {dmChats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Direct Messages</h2>
            <div className="space-y-1">
              {dmChats.map(chat => (
                <button key={chat.id} onClick={() => handleOpenChat(chat.id)} className="block w-full text-left">
                  <div className="flex items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                      {chat.avatar}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[var(--we-ink)] truncate">{chat.name}</p>
                        <p className="text-xs text-gray-400 shrink-0 ml-2">{chat.time}</p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="ml-2 w-5 h-5 bg-[var(--we-red)] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {filteredChats.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No conversations found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}
