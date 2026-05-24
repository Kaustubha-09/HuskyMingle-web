export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-950">
        {children}
      </div>
      {/* Right - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#8B0000] to-[#4a0000] items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-[#FFD700] font-bold text-4xl">H</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">HuskyMingle</h1>
          <p className="text-lg text-red-200 mb-8">Your campus super social platform — connect, collaborate, and thrive.</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            {[
              ['🤝', 'Smart Matching', 'Find students with shared interests'],
              ['💬', 'Translated Chat', 'Talk across language barriers'],
              ['🏪', 'Marketplace', 'Buy & sell within your campus'],
              ['🎓', 'Communities', 'Join groups for projects & research'],
            ].map(([emoji, title, desc]) => (
              <div key={title} className="bg-white bg-opacity-10 rounded-xl p-4">
                <div className="text-2xl mb-2">{emoji}</div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-red-200 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
