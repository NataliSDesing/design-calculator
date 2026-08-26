import re

path = '/Users/natalias./Documents/kimi/workspace/design-calculator/src/components/Calculator.tsx'
with open(path, 'r') as f:
    content = f.read()

# Add micro service icons after presentation-event
old_icons = "  'presentation-event': <Sparkles className=\"w-5 h-5\" />,\n};"
new_icons = """  'presentation-event': <Sparkles className="w-5 h-5" />,
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
};"""

content = content.replace(old_icons, new_icons)

# Update category order to include 'micro'
content = content.replace(
    "const categoryOrder: Category[] = ['design', 'marketing', 'advertising', 'presentation'];",
    "const categoryOrder: Category[] = ['design', 'marketing', 'advertising', 'presentation', 'micro'];"
)

# Update extras display to show conditions
old_extra_display = """                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="text-muted">{extraIcons[extra.id]}</span><span className="text-sm font-medium text-charcoal">{extra.name}</span></div>
                      <div className="text-xs text-muted mt-0.5">{extra.description}</div>
                    </div>"""

new_extra_display = """                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className="text-muted">{extraIcons[extra.id]}</span><span className="text-sm font-medium text-charcoal">{extra.name}</span></div>
                      <div className="text-xs text-muted mt-0.5">{extra.description}</div>
                      {extra.conditions && <div className="text-[10px] text-muted mt-1.5 bg-cream rounded-lg px-2 py-1.5 leading-relaxed">{extra.conditions}</div>}
                    </div>"""

content = content.replace(old_extra_display, new_extra_display)

with open(path, 'w') as f:
    f.write(content)

print('Done')
