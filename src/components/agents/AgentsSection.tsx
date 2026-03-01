import React, { useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiMoreVertical,
  FiPaperclip,
  FiSend,
  FiCheck,
} from "react-icons/fi";

type Agent = {
  name: string;
  title: string;
  specialization: string;
  experience: string;
  rating: number;
  clientsHelped: number;
  successRate: number;
  location: string;
  avatar: string;
  bio: string;
  credentials: string[];
  achievements: string[];
  languages: string[];
  availability: string;
  email: string;
  phone: string;
  linkedin: string;
};

type ChatMessage = {
  id: string;
  sender: "agent" | "client";
  text: string;
  time: string;
  attachment?: string;
};

const AGENTS: Agent[] = [
  {
    name: "Amber Griffin",
    title: "Senior Credit Dispute Analyst",
    specialization: "Credit Repair",
    experience: "9+ Years",
    rating: 4.9,
    clientsHelped: 1140,
    successRate: 95,
    location: "Austin, TX",
    avatar: "/placeholder.svg",
    bio: "Amber specializes in high-impact dispute strategy and score rebuilding plans.",
    credentials: [
      "FCRA Compliance Specialist",
      "Advanced Credit Analytics Certification",
      "Consumer Finance Coach",
    ],
    achievements: [
      "95% successful dispute outcomes",
      "Average score lift: +87 points",
      "4.9/5 client satisfaction",
    ],
    languages: ["English", "Spanish"],
    availability: "Available now",
    email: "amber.griffin@creditfixpro.com",
    phone: "+1 (555) 123-0004",
    linkedin: "amber-griffin-credit",
  },
  {
    name: "Robert Kim",
    title: "Identity Theft Recovery Specialist",
    specialization: "Identity Protection",
    experience: "11+ Years",
    rating: 4.7,
    clientsHelped: 820,
    successRate: 93,
    location: "Seattle, WA",
    avatar: "/placeholder.svg",
    bio: "Robert handles fraud recovery and identity theft remediation with end-to-end dispute support.",
    credentials: [
      "Certified Identity Theft Risk Management Specialist",
      "Fraud Investigation Certification",
      "Privacy Protection Professional",
    ],
    achievements: [
      "93% identity theft case resolution",
      "Average recovered fraud amount: $45,000",
      "85% restoration to pre-theft profile",
    ],
    languages: ["English", "Korean", "Japanese"],
    availability: "Available in 3 hours",
    email: "robert.kim@creditfixpro.com",
    phone: "+1 (555) 123-0007",
    linkedin: "robert-kim-identity",
  },
];

const MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    sender: "agent",
    text: "Hi, I am your account recovery agent. I know you from your dispute profile. Have you got a job?",
    time: "00:10",
  },
  {
    id: "m2",
    sender: "client",
    text: "Hi sir, I am not working yet, so can someone help me?",
    time: "00:12",
  },
  {
    id: "m3",
    sender: "agent",
    text: "Would you like to work in my company? Just send your portfolio first.",
    time: "00:14",
  },
  {
    id: "m4",
    sender: "client",
    text: "Ok sir, I will send.",
    time: "00:16",
    attachment: "Portfolio.pdf",
  },
];

const CLIENT = {
  name: "Samuel O.",
  status: "Online",
};

const AgentAvatar: React.FC<{ name: string }> = ({ name }) => {
  const initials = useMemo(
    () =>
      name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [name]
  );

  return (
    <div className="h-8 w-8 rounded-full bg-[#3D9B9B] text-white flex items-center justify-center text-xs font-semibold shadow-sm">
      {initials}
    </div>
  );
};

const TypingDots = () => {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-white/95 dark:bg-gray-700 px-3 py-2">
      <span
        className="h-1.5 w-1.5 rounded-full bg-[#3D9B9B] animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[#3D9B9B] animate-bounce"
        style={{ animationDelay: "120ms" }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-[#3D9B9B] animate-bounce"
        style={{ animationDelay: "240ms" }}
      />
    </div>
  );
};

type ChatPhoneProps = {
  headerName: string;
  headerStatus: string;
  messages: ChatMessage[];
  viewer: "agent" | "client";
  showTyping: boolean;
  typingLabel: string;
};

const ChatPhone: React.FC<ChatPhoneProps> = ({
  headerName,
  headerStatus,
  messages,
  viewer,
  showTyping,
  typingLabel,
}) => {
  return (
    <div className="w-full max-w-sm rounded-[28px] border border-[#d8deef] dark:border-gray-700 bg-[#dfe6f7] dark:bg-gray-900 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#d7def3] dark:bg-gray-800 border-b border-[#cfd8ef] dark:border-gray-700">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            className="text-gray-500 dark:text-gray-300 hover:text-[#3D9B9B] transition-colors"
          >
            <FiChevronLeft size={16} />
          </button>
          <AgentAvatar name={headerName} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {headerName}
            </p>
            <p className="text-[11px] text-[#3D9B9B] dark:text-[#57b8b8] truncate">
              {headerStatus}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="text-gray-500 dark:text-gray-300 hover:text-[#3D9B9B] transition-colors"
        >
          <FiMoreVertical size={16} />
        </button>
      </div>

      <div className="px-3 py-4 space-y-3 min-h-[360px] max-h-[460px] overflow-y-auto">
        {messages.map((message) => {
          const own = message.sender === viewer;
          return (
            <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  own
                    ? "bg-[#3D9B9B] text-white rounded-tr-md"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-tl-md"
                }`}
              >
                <p className="leading-relaxed">{message.text}</p>

                {message.attachment ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/20 px-2 py-1 text-[11px]">
                    <FiPaperclip size={12} />
                    <span>{message.attachment}</span>
                    <FiCheck size={12} />
                  </div>
                ) : null}

                <div className="mt-1 flex justify-end">
                  <span
                    className={`text-[10px] ${
                      own ? "text-white/80" : "text-gray-400 dark:text-gray-500"
                    }`}
                  >
                    {message.time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {showTyping ? (
          <div className="flex justify-start items-center gap-2">
            <TypingDots />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{typingLabel}</span>
          </div>
        ) : null}
      </div>

      <div className="px-3 pb-3 pt-2 bg-[#d7def3] dark:bg-gray-800 border-t border-[#cfd8ef] dark:border-gray-700">
        <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900 border border-[#d4dbef] dark:border-gray-700 px-2 py-2">
          <button
            type="button"
            className="h-7 w-7 rounded-lg grid place-items-center text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FiPaperclip size={14} />
          </button>
          <input
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder="Type a message..."
            readOnly
          />
          <button
            type="button"
            className="h-7 w-7 rounded-lg grid place-items-center bg-[#3D9B9B] text-white hover:bg-[#2f8181] transition-colors"
          >
            <FiSend size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const AgentsSection: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showTyping, setShowTyping] = useState(true);
  const selectedAgent = AGENTS[selectedIndex];

  useEffect(() => {
    let hideTimer: number | undefined;
    const runTypingPulse = () => {
      setShowTyping(true);
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
      hideTimer = window.setTimeout(() => setShowTyping(false), 1700);
    };
    runTypingPulse();
    const interval = window.setInterval(runTypingPulse, 6500);

    return () => {
      window.clearInterval(interval);
      if (hideTimer) {
        window.clearTimeout(hideTimer);
      }
    };
  }, []);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Assigned Agents</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Select an agent to preview both conversation sides.
          </p>

          <div className="space-y-2">
            {AGENTS.map((agent, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={agent.email}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                    active
                      ? "border-[#3D9B9B] bg-[#3D9B9B]/10 dark:bg-[#3D9B9B]/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-[#3D9B9B]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AgentAvatar name={agent.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {agent.specialization}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 md:p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Agent and Client Chat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              User view keeps <span className="font-medium">{selectedAgent.name}</span> at the top.
              Agent view keeps <span className="font-medium">{CLIENT.name}</span> at the top.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 place-items-center">
            <div className="w-full">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 text-center">
                User Side
              </p>
              <div className="flex justify-center">
                <ChatPhone
                  headerName={selectedAgent.name}
                  headerStatus={selectedAgent.availability}
                  messages={MESSAGES}
                  viewer="client"
                  showTyping={showTyping}
                  typingLabel={`${selectedAgent.name.split(" ")[0]} is typing...`}
                />
              </div>
            </div>

            <div className="w-full">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 text-center">
                Agent Side
              </p>
              <div className="flex justify-center">
                <ChatPhone
                  headerName={CLIENT.name}
                  headerStatus={CLIENT.status}
                  messages={MESSAGES}
                  viewer="agent"
                  showTyping={showTyping}
                  typingLabel={`${CLIENT.name.split(" ")[0]} is typing...`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentsSection;
