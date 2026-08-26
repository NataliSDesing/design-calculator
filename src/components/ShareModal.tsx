import { useState, useEffect, useCallback } from 'react';
import { X, Link2, Mail, Send, MessageCircle, Share2, Check } from 'lucide-react';
import { getShareUrl, type SharedState } from '../utils/share';
import { services, extras, urgencyMultipliers, calculateServicePrice, calculateServiceTimeline, formatTimeline } from '../data/pricing';

interface ShareModalProps {
  state: SharedState;
  total: number;
  timeline: number;
  onClose: () => void;
}

export default function ShareModal({ state, total, timeline, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = getShareUrl(state);

  const buildEmailBody = useCallback(() => {
    const lines = state.configs.map((cfg) => {
      const svc = services.find((s) => s.id === cfg.serviceId);
      if (!svc) return '';
      const price = calculateServicePrice(cfg);
      const tl = calculateServiceTimeline(cfg);
      return `• ${svc.name} — ${cfg.units} ${svc.unitName} — ${price.toLocaleString('ru-RU')} ₽ (~${formatTimeline(tl)})`;
    }).filter(Boolean);

    const extraLines = state.extras.map((id) => {
      const e = extras.find((ex) => ex.id === id);
      return e ? `• ${e.name} — +${e.price.toLocaleString('ru-RU')} ₽` : '';
    }).filter(Boolean);

    const urgencyLabel = urgencyMultipliers[state.urgency].label;

    return [
      'Коммерческое предложение от 4NS Agency',
      '',
      ...lines,
      ...(extraLines.length > 0 ? ['', 'Дополнительно:', ...extraLines] : []),
      '',
      `Срочность: ${urgencyLabel}`,
      `Итоговая стоимость: ${total.toLocaleString('ru-RU')} ₽`,
      `Срок: ${formatTimeline(timeline)}`,
      '',
      '---',
      'Рассчитано в калькуляторе 4NS Agency',
      shareUrl,
    ].join('\n');
  }, [state, total, timeline, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleEmail = useCallback(() => {
    const body = buildEmailBody();
    const subject = encodeURIComponent('Коммерческое предложение — 4NS Agency');
    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`, '_blank');
  }, [buildEmailBody]);

  const handleTelegram = useCallback(() => {
    const text = buildEmailBody();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text.slice(0, 1000))}`, '_blank');
  }, [buildEmailBody, shareUrl]);

  const handleWhatsApp = useCallback(() => {
    const text = buildEmailBody();
    window.open(`https://wa.me/?text=${encodeURIComponent(text.slice(0, 2000))}`, '_blank');
  }, [buildEmailBody]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'Коммерческое предложение — 4NS Agency',
        text: buildEmailBody().slice(0, 300) + '...',
        url: shareUrl,
      });
    } catch {
      // User cancelled
    }
  }, [buildEmailBody, shareUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-surface rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'Unbounded, sans-serif', color: '#1A1A1A' }}>Поделиться КП</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-cream transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <button onClick={handleCopyLink} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-cream hover:border-coral transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-[#CCE94B] flex items-center justify-center shrink-0">{copied ? <Check className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}</div>
            <div><div className="font-medium text-sm">{copied ? 'Ссылка скопирована!' : 'Скопировать ссылку'}</div><div className="text-xs text-muted">Отправьте ссылку на этот расчёт</div></div>
          </button>
          <button onClick={handleEmail} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-cream hover:border-coral transition-colors text-left">
            <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] text-white flex items-center justify-center shrink-0"><Mail className="w-5 h-5" /></div>
            <div><div className="font-medium text-sm">Отправить по email</div><div className="text-xs text-muted">Откроется почтовый клиент</div></div>
          </button>
          <button onClick={handleTelegram} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-cream hover:border-coral transition-colors text-left">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#229ED9', color: '#fff' }}><Send className="w-5 h-5" /></div>
            <div><div className="font-medium text-sm">Telegram</div><div className="text-xs text-muted">Отправить в Telegram</div></div>
          </button>
          <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-cream hover:border-coral transition-colors text-left">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#25D366', color: '#fff' }}><MessageCircle className="w-5 h-5" /></div>
            <div><div className="font-medium text-sm">WhatsApp</div><div className="text-xs text-muted">Отправить в WhatsApp</div></div>
          </button>
          {canNativeShare && (
            <button onClick={handleNativeShare} className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border bg-cream hover:border-coral transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-[#FF525C] text-white flex items-center justify-center shrink-0"><Share2 className="w-5 h-5" /></div>
              <div><div className="font-medium text-sm">Поделиться</div><div className="text-xs text-muted">Нативное меню шаринга</div></div>
            </button>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted">Получатель сможет открыть ссылку и увидеть точно такой же расчёт</p>
        </div>
      </div>
    </div>
  );
}
