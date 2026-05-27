"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Mic, Send, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { processAgroVoiceCommand } from "@/app/actions/ai";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  isVoice?: boolean;
  timestamp: string;
  actions?: { label: string; onClick: () => void }[];
}

export function AgriIAChat({ tenantId }: { tenantId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "ai",
      text: "Olá! Sou o **AgriIA**, seu assistente de gestão agrícola. Como posso te ajudar hoje?",
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text || text.trim() === "") return;

    if (!textToSend) {
      setInputText("");
    }

    const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: text,
      timestamp: time,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await processAgroVoiceCommand(tenantId, text);
      
      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: response.message,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      
      if (response.success) {
        toast.success("Comando executado!");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error(error);
      const errMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: "Desculpe, ocorreu um erro ao processar seu comando.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error("Erro de conexão com o assistente.");
    } finally {
      setLoading(false);
    }
  };

  // Voice Command Simulation
  const handleVoiceSimulate = () => {
    const commands = [
      "Adicionar 50 litros de diesel no trator JD-450 campo sul",
      "Gastei 1500 reais em fertilizante para o Talhão Leste",
      "Adicionar novo talhão Norte com 250 ha de soja",
      "Registrar colheita de 45 toneladas de soja no Talhão Sul",
    ];
    
    // Pick a random command
    const randomCommand = commands[Math.floor(Math.random() * commands.length)];
    
    // Add simulated voice output
    toast.info("Escutando voz...");
    
    setTimeout(() => {
      handleSend(randomCommand);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 bg-gradient-to-br from-primary to-emerald-600 text-white shadow-xl hover:scale-110 transition-transform duration-300 animate-pulse flex items-center justify-center border-none"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </div>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 w-[380px] sm:w-[400px] h-[550px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] z-[99] flex flex-col overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-emerald-700 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-full">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h5 className="font-heading font-bold text-base leading-tight">AgriIA</h5>
                <p className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wider">
                  Assistente Inteligente
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/10 rounded-full h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                  }`}
                >
                  <p 
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 px-1 font-semibold">
                  {msg.timestamp} {msg.sender === "ai" ? "• AgriIA" : ""}
                </span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs p-2">
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                AgriIA está digitando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleVoiceSimulate}
                className="rounded-full w-11 h-11 p-0 bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-md shrink-0 transition-transform active:scale-95"
                title="Simular comando de voz"
              >
                <Mic className="h-5 w-5" />
              </Button>
              <div className="flex-1 relative flex items-center">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  className="w-full rounded-full py-5 pl-4 pr-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm focus-visible:ring-primary"
                  placeholder="Pergunte ou comande a fazenda..."
                />
                <Button
                  onClick={() => handleSend()}
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 text-primary hover:text-primary/80 hover:bg-transparent"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
