import React, { useState, useEffect } from 'react';
import { 
  Bot, Send, User, Mic, MicOff, Calendar, 
  Sparkles, Check, RefreshCw 
} from 'lucide-react';
import { listEntity, createEntity } from '../services/api';

export default function AIReceptionist() {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'ai', text: "Hello! I am Dentora's AI Receptionist. You can tell me to book appointments or search for patients. Try typing something like: *'Book Rahul Sharma for tomorrow at 10 AM with Dr. Chaitanya for a General Checkup'*.", time: 'Just now' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Parsed appointment details extraction simulation
  const [parsedBooking, setParsedBooking] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'en-US';
      rec.onresult = (event) => {
        const voiceText = event.results[0][0].transcript;
        setInput(voiceText);
        setIsRecording(false);
      };
      rec.onerror = () => setIsRecording(false);
      setRecognition(rec);
    }
  }, []);

  const handleVoiceListen = () => {
    if (!recognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognition.start();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const newMsg = {
      id: String(Date.now()),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate receptionist analysis
    setTimeout(() => {
      let replyText = "I've analyzed your request. I can help you schedule this appointment immediately. Please confirm the details below.";
      
      // Simple dynamic parser logic
      const textLower = userText.toLowerCase();
      let docName = 'Dr. Chaitanya';
      if (textLower.includes('anusha')) docName = 'Dr. Anusha';
      if (textLower.includes('vikram')) docName = 'Dr. Vikram';

      let patientName = 'Rahul Sharma';
      if (textLower.includes('priya')) patientName = 'Priya Patel';
      if (textLower.includes('amit')) patientName = 'Amit Verma';

      let time = '10:00 AM';
      if (textLower.includes('11')) time = '11:00 AM';
      if (textLower.includes('12')) time = '12:00 PM';
      if (textLower.includes('2') || textLower.includes('pm')) time = '02:00 PM';

      let treatment = 'General Checkup';
      if (textLower.includes('cleaning')) treatment = 'Dental Cleaning';
      if (textLower.includes('root canal') || textLower.includes('rct')) treatment = 'Root Canal Therapy';
      if (textLower.includes('filling') || textLower.includes('cavity')) treatment = 'Cavity Filling';

      let date = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // Tomorrow

      setParsedBooking({
        patient_name: patientName,
        doctor_name: docName,
        appointment_date: date,
        appointment_time: time,
        treatment_type: treatment
      });

      setMessages(prev => [...prev, {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleConfirmBooking = async () => {
    if (!parsedBooking) return;
    try {
      setIsTyping(true);
      const appt = {
        ...parsedBooking,
        notes: 'Created via AI Chatbot Receptionist.',
        status: 'Scheduled',
        created_date: new Date().toISOString()
      };
      await createEntity('Appointment', appt);

      setMessages(prev => [...prev, {
        id: String(Date.now()),
        sender: 'ai',
        text: `Awesome! I've successfully scheduled the appointment for **${appt.patient_name}** with **${appt.doctor_name}** on **${appt.appointment_date}** at **${appt.appointment_time}**.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setParsedBooking(null);
    } catch (err) {
      alert(`Booking error: ${err.message}`);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/10">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">AI Receptionist</h2>
          <p className="text-sm text-slate-500 mt-1">Converse with the virtual assistant to schedule bookings non-interactively</p>
        </div>
      </div>

      {/* Main chat window */}
      <div className="bg-white rounded-2xl border border-blue-50 shadow-sm flex flex-col h-[520px] overflow-hidden">
        {/* Chat message pane */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                msg.sender === 'user' ? 'bg-blue-600 text-white font-bold text-xs' : 'bg-slate-200 text-slate-700'
              }`}>
                {msg.sender === 'user' ? 'U' : <Bot className="w-4 h-4" />}
              </div>
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-750 border border-slate-100 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <p className="text-[10px] text-slate-400 font-semibold px-2">{msg.time}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8.5 h-8.5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shadow-sm shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white p-3 border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1 shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Parsed details confirmation overlay card */}
          {parsedBooking && (
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-md max-w-md mx-auto space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-blue-600 font-bold border-b border-slate-100 pb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Confirm Structured Appointment</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-650">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Patient</span>
                  <span className="text-slate-800">{parsedBooking.patient_name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Doctor</span>
                  <span className="text-slate-800">{parsedBooking.doctor_name}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Date</span>
                  <span className="text-slate-800">{parsedBooking.appointment_date}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Time slot</span>
                  <span className="text-slate-800">{parsedBooking.appointment_time}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Treatment</span>
                  <span className="text-blue-700">{parsedBooking.treatment_type}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setParsedBooking(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmBooking}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Schedule</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={handleVoiceListen}
            className={`p-3 rounded-xl transition-all duration-200 ${isRecording ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
            title="Speak message"
          >
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            placeholder={isRecording ? 'Listening...' : 'Type appointment details e.g. Book Priya for 11 AM...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
