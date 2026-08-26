import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Palette, Layers, Globe, Smartphone, Printer, Share2, PenTool, Play,
  Zap, Clock, AlertTriangle, Check, RefreshCcw,
  FileText, Sparkles, Lightbulb, Tag, Monitor, HeadphonesIcon, Presentation,
  TrendingUp, Megaphone, BarChart3, Mail, Search, Users, Target, Newspaper,
  Trash2, Download, Layout, Send, Image, CreditCard, Circle
} from 'lucide-react';
import { exportDOCX } from '../utils/docxExport';
import { readStateFromUrl } from '../utils/share';
import ShareModal from './ShareModal';
import {
  services, extras, urgencyMultipliers, revisionsOptions,
  categoryLabels, calculateServicePrice, calculateServiceTimeline, formatTimeline,
  type Service, type ServiceConfig, type Category,
} from '../data/pricing';

const serviceIcons: Record<string, React.ReactNode> = {
  logo: <PenTool className="w-5 h-5" />,
  identity: <Palette className="w-5 h-5" />,
  web: <Globe className="w-5 h-5" />,
  uiux: <Smartphone className="w-5 h-5" />,
  print: <Printer className="w-5 h-5" />,
  social: <Share2 className="w-5 h-5" />,
  illustration: <Layers className="w-5 h-5" />,
  motion: <Play className="w-5 h-5" />,
  'marketing-strategy': <TrendingUp className="w-5 h-5" />,
  'content-plan': <FileText className="w-5 h-5" />,
  smm: <Users className="w-5 h-5" />,
  'email-marketing': <Mail className="w-5 h-5" />,
  seo: <Search className="w-5 h-5" />,
  context: <Target className="w-5 h-5" />,
  target: <Megaphone className="w-5 h-5" />,
  media: <BarChart3 className="w-5 h-5" />,
  influencer: <Users className="w-5 h-5" />,
  pr: <Newspaper className="w-5 h-5" />,
  'presentation-standard': <Presentation className="w-5 h-5" />,
  'pitch-deck': <Layout className="w-5 h-5" />,
  'presentation-invest': <FileText className="w-5 h-5" />,
  'presentation-event': <Sparkles className="w-5 h-5" />,
  // Micro services
  'flyer-1': <FileText className="w-5 h-5" />,
  'flyer-2': <FileText className="w-5 h-5" />,
  'poster': <Image className="w-5 h-5" />,
  'web-screen': <Layout className="w-5 h-5" />,
  'icon': <Circle className="w-5 h-5" />,
  'ai-image': <Sparkles className="w-5 h-5" />,
  'social-post': <Share2 className="w-5 h-5" />,
  'story': <Smartphone className="w-5 h-5" />,
  'banner': <Monitor className="w-5 h-5" />,
  'business-card': <CreditCard className="w-5 h-5" />,
  'email-design': <Mail className="w-5 h-5" />,
  'slide-design': <Presentation className="w-5 h-5" />,
};

const extraIcons: Record<string, React.ReactNode> = {
  research: <Lightbulb className="w-4 h-4" />,
  strategy: <Sparkles className="w-4 h-4" />,
  naming: <Tag className="w-4 h-4" />,
  printprep: <Printer className="w-4 h-4" />,
  adaptation: <Monitor className="w-4 h-4" />,
  source: <FileText className="w-4 h-4" />,
  support: <HeadphonesIcon className="w-4 h-4" />,
  presentation: <Presentation className="w-4 h-4" />,
};

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU');
}

function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const start = display;
    const diff = value - start;
    const duration = 400;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{formatPrice(display)}</span>;
}

const categoryOrder: Category[] = ['design', 'marketing', 'advertising', 'presentation', 'micro'];

export default function Calculator() {
  const [activeCategory, setActiveCategory] = useState<Category>('design');
  const [selectedConfigs, setSelectedConfigs] = useState<ServiceConfig[]>([
    { serviceId: 'logo', units: 3, revisions: 2 },
  ]);
  const [urgency, setUrgency] = useState<'normal' | 'fast' | 'emergency'>('normal');
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const shared = readStateFromUrl();
    if (shared) {
      setSelectedConfigs(shared.configs);
      setUrgency(shared.urgency);
      setSelectedExtras(new Set(shared.extras));
    }
  }, []);

  const isSelected = (serviceId: string) => selectedConfigs.some((c) => c.serviceId === serviceId);

  const addService = (service: Service) => {
    if (isSelected(service.id)) return;
    setSelectedConfigs((prev) => [...prev, { serviceId: service.id, units: service.defaultUnits, revisions: 2 }]);
  };

  const removeService = (serviceId: string) => {
    setSelectedConfigs((prev) => prev.filter((c) => c.serviceId !== serviceId));
  };

  const updateConfig = (serviceId: string, patch: Partial<ServiceConfig>) => {
    setSelectedConfigs((prev) => prev.map((c) => (c.serviceId === serviceId ? { ...c, ...patch } : c)));
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setSelectedConfigs([{ serviceId: 'logo', units: 3, revisions: 2 }]);
    setUrgency('normal');
    setSelectedExtras(new Set());
  };

  const lineItems = useMemo(() => {
    const items = selectedConfigs.map((config) => {
      const service = services.find((s) => s.id === config.serviceId)!;
      return { config, service, subtotal: calculateServicePrice(config), timeline: calculateServiceTimeline(config) };
    });
    const baseSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    // Micro services run in parallel (max), others run sequentially (sum)
    const microItems = items.filter((i) => i.service.category === 'micro');
    const nonMicroItems = items.filter((i) => i.service.category !== 'micro');
    const microMaxTimeline = microItems.length > 0 ? Math.max(...microItems.map((i) => i.timeline)) : 0;
    const nonMicroTimeline = nonMicroItems.reduce((sum, i) => sum + i.timeline, 0);
    const baseTimeline = microMaxTimeline + nonMicroTimeline;

    const afterUrgencyPrice = Math.round(baseSubtotal * urgencyMultipliers[urgency].priceMultiplier);
    const afterUrgencyTimeline = Math.max(1, Math.ceil(baseTimeline * urgencyMultipliers[urgency].timelineMultiplier));
    const extrasTotal = Array.from(selectedExtras).reduce((sum, id) => sum + (extras.find((e) => e.id === id)?.price || 0), 0);
    return { items, baseSubtotal, afterUrgencyPrice, baseTimeline, afterUrgencyTimeline, extrasTotal, total: afterUrgencyPrice + extrasTotal };
  }, [selectedConfigs, urgency, selectedExtras]);

  const servicesByCategory = useMemo(() => {
    const grouped: Record<Category, Service[]> = { design: [], marketing: [], advertising: [], presentation: [], micro: [] };
    services.forEach((s) => grouped[s.category].push(s));
    return grouped;
  }, []);

  const handleExportDOCX = useCallback(async () => {
    if (selectedConfigs.length === 0) return;
    setExporting(true);
    try {
      await exportDOCX({
        items: lineItems.items.map((item) => ({ config: item.config, serviceName: item.service.name, unitName: item.service.unitName, quantity: item.config.units, price: calculateServicePrice(item.config), total: item.subtotal, timeline: item.timeline })),
        baseSubtotal: lineItems.baseSubtotal, afterUrgencyPrice: lineItems.afterUrgencyPrice, baseTimeline: lineItems.baseTimeline,
        afterUrgencyTimeline: lineItems.afterUrgencyTimeline, extrasTotal: lineItems.extrasTotal, total: lineItems.total,
        urgencyLabel: urgencyMultipliers[urgency].label, urgencyMultiplier: urgencyMultipliers[urgency].priceMultiplier,
        selectedExtras: Array.from(selectedExtras),
      });
    } finally { setExporting(false); }
  }, [lineItems, urgency, selectedExtras, selectedConfigs.length]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="logo.png" alt="4NS Agency" className="h-8 sm:h-10 w-auto object-contain" />
              <div className="hidden sm:block w-px h-8 bg-border" />
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-charcoal tracking-tight font-display">Калькулятор услуг</h1>
                <p className="text-muted text-xs mt-0.5">Дизайн + Маркетинг + Реклама + Презентации</p>
              </div>
            </div>
            <button onClick={reset} className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-charcoal transition-colors rounded-xl hover:bg-surface-hover">
              <RefreshCcw className="w-4 h-4" /><span className="hidden sm:inline">Сбросить</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex gap-2 flex-wrap">
              {categoryOrder.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeCategory === cat ? 'bg-charcoal text-cream' : 'bg-surface text-muted hover:text-charcoal border border-border'}`}>
                  <span className={`w-2 h-2 rounded-full ${categoryLabels[cat].color}`} />
                  {categoryLabels[cat].label}
                  <span className="text-xs opacity-60">({selectedConfigs.filter((c) => services.find((s) => s.id === c.serviceId)?.category === cat).length})</span>
                </button>
              ))}
            </div>

            <section className="animate-slide-up">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {servicesByCategory[activeCategory].map((service) => {
                  const selected = isSelected(service.id);
                  return (
                    <button key={service.id} onClick={() => (selected ? removeService(service.id) : addService(service))}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${selected ? 'border-coral bg-coral/[0.04]' : 'border-border bg-surface hover:border-muted'}`}>
                      {selected && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-coral text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${selected ? 'bg-coral text-white' : 'bg-cream text-muted'}`}>{serviceIcons[service.id]}</div>
                      <div className="text-sm font-medium text-charcoal pr-6">{service.name}</div>
                      <div className="text-xs text-muted mt-0.5">{service.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-mono text-muted">
                          {service.category === 'micro' ? `${formatPrice(service.pricePerUnit)} ₽/шт` : `от ${formatPrice(service.basePrice)} ₽`}
                        </span>
                        <span className="text-[10px] text-muted">·</span>
                        <span className="text-[10px] text-muted">~{formatTimeline(service.timelineDays)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {selectedConfigs.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-medium text-muted uppercase tracking-wider">Настройка выбранных услуг</h2>
                {selectedConfigs.map((config) => {
                  const service = services.find((s) => s.id === config.serviceId)!;
                  const itemPrice = calculateServicePrice(config);
                  const itemTimeline = calculateServiceTimeline(config);
                  const isMicro = service.category === 'micro';
                  return (
                    <div key={config.serviceId} className="bg-surface rounded-xl border-2 border-border p-5 animate-slide-up">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-coral text-white flex items-center justify-center">{serviceIcons[service.id]}</div>
                          <div><div className="font-medium text-charcoal">{service.name}</div><div className="text-xs text-muted">{service.description}</div></div>
                        </div>
                        <button onClick={() => removeService(config.serviceId)} className="p-1.5 text-muted hover:text-coral transition-colors rounded-lg hover:bg-cream"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className={`grid grid-cols-1 ${isMicro ? '' : 'sm:grid-cols-2'} gap-4`}>
                        <div>
                          <label className="text-xs text-muted mb-2 block">{service.unitName}: <span className="font-mono text-charcoal font-semibold">{config.units}</span></label>
                          <input type="range" min={service.minUnits} max={service.maxUnits} value={config.units}
                            onChange={(e) => updateConfig(config.serviceId, { units: Number(e.target.value) })} className="range-slider" />
                          <div className="flex justify-between text-[10px] text-muted mt-1"><span>{service.minUnits}</span><span>{service.maxUnits}</span></div>
                        </div>
                        {!isMicro && (
                          <div>
                            <label className="text-xs text-muted mb-2 block">Правки</label>
                            <div className="flex flex-wrap gap-1.5">
                              {revisionsOptions.map((opt) => (
                                <button key={opt.value} onClick={() => updateConfig(config.serviceId, { revisions: opt.value })}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.revisions === opt.value ? 'bg-coral text-white' : 'bg-cream text-muted hover:text-charcoal'}`}>{opt.label}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <span className="text-xs text-muted">Срок: ~{formatTimeline(itemTimeline)}</span>
                        <span className="text-sm font-semibold font-mono text-charcoal">{formatPrice(itemPrice)} ₽</span>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            <section className="animate-slide-up">
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Срочность проекта</h2>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(urgencyMultipliers) as Array<'normal' | 'fast' | 'emergency'>).map((key) => (
                  <button key={key} onClick={() => setUrgency(key)}
                    className={`urgency-btn p-4 rounded-xl border-2 text-center ${urgency === key ? 'selected border-coral' : 'border-border bg-surface hover:border-muted'}`}>
                    <div className="flex justify-center mb-2">{key === 'normal' && <Clock className="w-5 h-5" />}{key === 'fast' && <Zap className="w-5 h-5" />}{key === 'emergency' && <AlertTriangle className="w-5 h-5" />}</div>
                    <div className="text-sm font-medium">{urgencyMultipliers[key].label}</div>
                    <div className="text-xs opacity-80 mt-1">{urgencyMultipliers[key].description}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="animate-slide-up">
              <h2 className="text-sm font-medium text-muted uppercase tracking-wider mb-4">Дополнительные опции</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {extras.map((extra) => (
                  <label key={extra.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedExtras.has(extra.id) ? 'border-coral bg-coral/[0.04]' : 'border-border bg-surface hover:border-muted'}`}>
                    <input type="checkbox" className="sr-only" checked={selectedExtras.has(extra.id)} onChange={() => toggleExtra(extra.id)} />
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors ${selectedExtras.has(extra.id) ? 'bg-coral border-coral' : 'border-muted'}`}>
                      {selectedExtras.has(extra.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="text-muted">{extraIcons[extra.id]}</span><span className="text-sm font-medium text-charcoal">{extra.name}</span></div>
                      <div className="text-xs text-muted mt-0.5">{extra.description}</div>
                      {extra.conditions && <div className="text-[10px] text-muted mt-1.5 bg-cream rounded-lg px-2 py-1.5 leading-relaxed">{extra.conditions}</div>}
                    </div>
                    <div className="text-sm font-medium text-charcoal font-mono">+{formatPrice(extra.price)} ₽</div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="bg-charcoal rounded-2xl p-6 text-cream">
                <div className="flex items-center justify-between mb-5">
                  <img src="logo.png" alt="4NS Agency" className="h-6 w-auto object-contain invert" />
                  <span className="text-[10px] opacity-40 font-mono">{new Date().toLocaleDateString('ru-RU')}</span>
                </div>
                <h3 className="text-sm font-medium opacity-60 uppercase tracking-wider mb-5 font-display">Коммерческое предложение</h3>
                <div className="space-y-3 mb-5">
                  {lineItems.items.map(({ config, service, subtotal, timeline }) => (
                    <div key={config.serviceId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="opacity-50">{serviceIcons[service.id]}</span>
                        <span className="text-sm opacity-80">{service.name}</span>
                        <span className="text-[10px] opacity-40">({config.units} {service.unitName})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">{formatPrice(subtotal)} ₽</div>
                        <div className="text-[10px] opacity-50">~{formatTimeline(timeline)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border-dark pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2"><span className="text-sm opacity-60">Базовый срок</span><span className="text-sm font-mono">{formatTimeline(lineItems.baseTimeline)}</span></div>
                  <div className="flex justify-between items-center mb-2"><span className="text-sm opacity-60">{urgencyMultipliers[urgency].label}</span><span className="text-sm font-mono">{formatTimeline(lineItems.afterUrgencyTimeline)}</span></div>
                </div>
                <div className="border-t border-border-dark pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2"><span className="text-sm opacity-60">Подытог услуг</span><span className="text-sm font-mono">{formatPrice(lineItems.baseSubtotal)} ₽</span></div>
                  <div className="flex justify-between items-center mb-2"><span className="text-sm opacity-60">{urgencyMultipliers[urgency].label}</span><span className="text-sm font-mono">×{urgencyMultipliers[urgency].priceMultiplier}</span></div>
                  {lineItems.extrasTotal > 0 && <div className="flex justify-between items-center"><span className="text-sm opacity-60">Дополнительно</span><span className="text-sm font-mono">{formatPrice(lineItems.extrasTotal)} ₽</span></div>}
                </div>
                <div className="border-t border-border-dark pt-5 mb-5">
                  <div className="flex items-baseline justify-between">
                    <div><span className="text-lg font-display">Итого</span><div className="text-xs opacity-50 mt-1">Срок: {formatTimeline(lineItems.afterUrgencyTimeline)}</div></div>
                    <span className="text-3xl sm:text-4xl font-semibold font-mono tracking-tight"><AnimatedPrice value={lineItems.total} /> ₽</span>
                  </div>
                </div>
                <div className="border-t border-border-dark pt-4 text-[10px] opacity-40 text-center">Ориентировочная стоимость. Финальная цена и сроки зависят от технического задания.</div>
              </div>

              <button onClick={() => setShareModalOpen(true)} disabled={selectedConfigs.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2" style={{ borderColor: '#1A1A1A', color: '#1A1A1A' }}>
                <Send className="w-4 h-4" />Поделиться КП
              </button>

              <button onClick={handleExportDOCX} disabled={exporting || selectedConfigs.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#CCE94B', color: '#1A1A1A' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#A8C93A')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#CCE94B')}>
                <Download className="w-4 h-4" />{exporting ? 'Генерация DOCX...' : 'Скачать КП в DOCX'}
              </button>

              <div className="bg-surface rounded-2xl border border-border p-5">
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 font-display">Распределение по направлениям</h4>
                <div className="space-y-3">
                  {categoryOrder.map((cat) => {
                    const catItems = lineItems.items.filter((i) => i.service.category === cat);
                    const catTotal = catItems.reduce((s, i) => s + i.subtotal, 0);
                    const catTimeline = catItems.reduce((s, i) => s + i.timeline, 0);
                    const percent = lineItems.baseSubtotal > 0 ? (catTotal / lineItems.baseSubtotal) * 100 : 0;
                    if (catItems.length === 0) return null;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${categoryLabels[cat].color}`} />{categoryLabels[cat].label}</span>
                          <div className="text-right"><span className="font-mono">{formatPrice(catTotal)} ₽</span><span className="text-[10px] text-muted ml-2">~{formatTimeline(catTimeline)}</span></div>
                        </div>
                        <div className="h-1.5 bg-cream rounded-full overflow-hidden"><div className={`h-full rounded-full ${categoryLabels[cat].color}`} style={{ width: `${percent}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-surface">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#CCE94B' }} />
                  <p className="text-xs text-muted">Комбинируйте услуги из разных направлений для комплексных проектов — так эффективнее для клиента и выгоднее для агентства.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {shareModalOpen && (
        <ShareModal state={{ configs: selectedConfigs, urgency, extras: Array.from(selectedExtras) }} total={lineItems.total} timeline={lineItems.afterUrgencyTimeline} onClose={() => setShareModalOpen(false)} />
      )}
    </div>
  );
}
