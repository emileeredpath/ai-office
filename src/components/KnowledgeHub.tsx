interface KnowledgeHubProps {
  companyId: string;
  currentUserId: string;
}

export function KnowledgeHub({ companyId, currentUserId }: KnowledgeHubProps) {
  const resources = [
    {
      category: 'Brand Guidelines',
      items: [
        { title: 'MTech Brand Standards', description: 'Core brand identity and usage guidelines' },
        { title: 'Brentwood Brand Kit', description: 'Regional brand identity for Brentwood' },
        { title: 'Radio Links Visual Identity', description: 'Color palette, typography, and logo usage' },
        { title: 'Capcom Brand Assets', description: 'Brand standards and asset library' },
        { title: 'IRCL Visual Guidelines', description: 'Branding guidelines for Irish operations' },
      ],
    },
    {
      category: 'Content Guidelines',
      items: [
        { title: 'Tone of Voice', description: 'Writing style and communication standards' },
        { title: 'Email Campaign Standards', description: 'Best practices for email marketing' },
        { title: 'Social Media Policy', description: 'Guidelines for social media posting' },
        { title: 'Website Content', description: 'Standards for website copy and structure' },
      ],
    },
    {
      category: 'Compliance & Legal',
      items: [
        { title: "Martyn's Law Compliance", description: 'Security standards and requirements' },
        { title: 'GDPR Guidelines', description: 'Data protection and privacy standards' },
        { title: 'Copyright & IP', description: 'Intellectual property guidelines' },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Knowledge Hub
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Brand guidelines, content standards, and reference materials
          </p>
        </div>

        {/* Resource Categories */}
        <div className="space-y-8">
          {resources.map((category) => (
            <div key={category.category}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {category.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.items.map((item) => (
                  <div
                    key={item.title}
                    className="p-4 rounded-lg cursor-pointer transition-all hover:border-opacity-100"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      border: '1px solid',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#15171E';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-secondary)';
                    }}
                  >
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mt-12 p-6 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', border: '1px solid' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Quick Links
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Brand Assets', 'Templates', 'Documentation', 'Help Center'].map((link) => (
              <a
                key={link}
                href="#"
                className="p-3 text-center rounded-lg transition-all"
                style={{
                  backgroundColor: 'var(--border-color)',
                  color: '#F97031',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#2A3141';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--border-color)';
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
