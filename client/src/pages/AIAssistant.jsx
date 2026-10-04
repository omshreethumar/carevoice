import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../services/api';
import { ErrorBanner, Spinner } from '../components/ui';

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/ai/conversations')
      .then((res) => {
        const latest = res.data.data?.[0];
        if (latest) {
          setConversationId(latest.id);
          setMessages(latest.messages || []);
        }
      })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/ai/chat', { message: text, conversationId });
      setConversationId(res.data.data.conversationId);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.data.data.reply, disclaimer: res.data.data.disclaimer },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (booting) return <Spinner label="Loading Pocket AI..." />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Sparkles className="text-brand-600" /> Pocket AI
        </h1>
        <p className="text-sm text-slate-500">
          Answers use your live financial data. AI requests never leave the backend with your OpenAI key.
        </p>
      </div>
      <ErrorBanner message={error} />
      <div className="card flex min-h-[420px] flex-col p-4">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="space-y-2 text-sm text-slate-600">
              <p>Try asking:</p>
              <ul className="list-disc pl-5">
                <li>Where am I spending the most?</li>
                <li>Can I afford a ₹10,000 purchase?</li>
                <li>How can I save ₹20,000 in 3 months?</li>
                <li>Why did my expenses increase this month?</li>
              </ul>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === 'user' ? 'ml-auto bg-brand-600 text-white' : 'bg-slate-50 text-slate-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.disclaimer ? <p className="mt-2 text-[11px] opacity-70">{m.disclaimer}</p> : null}
              </div>
            ))
          )}
          {loading ? <p className="text-sm text-slate-400">Pocket AI is thinking...</p> : null}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={send}>
          <input className="input" placeholder="Ask about your money..." value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="btn-primary" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
