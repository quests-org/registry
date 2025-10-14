function App() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
      <main className="flex flex-col items-center gap-8 max-w-2xl">
        <h1 className="text-5xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Get started by editing app.tsx
        </h1>

        <p className="text-lg text-gray-600 text-center">
          Your project is ready to go with a modern stack
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8 mt-8">
          <a
            href="https://react.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <svg className="size-16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="#61DAFB" strokeWidth="1" />
              <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" stroke="#61DAFB" strokeWidth="1" />
              <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" stroke="#61DAFB" strokeWidth="1" />
            </svg>
            <span className="text-sm font-medium text-gray-700">React</span>
          </a>

          <a
            href="https://vitejs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <svg className="size-16" viewBox="0 0 24 24" fill="none">
              <path d="M23 4L13.5 22L11 14.5L3 12L23 4Z" fill="url(#vite-gradient)" />
              <defs>
                <linearGradient id="vite-gradient" x1="3" y1="4" x2="23" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#41D1FF" />
                  <stop offset="1" stopColor="#BD34FE" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-sm font-medium text-gray-700">Vite</span>
          </a>

          <a
            href="https://hono.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <svg className="size-16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#FF6600" />
              <path d="M8 10C8 10 10 8 12 8C14 8 16 10 16 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="9" cy="11" r="1" fill="white" />
              <circle cx="15" cy="11" r="1" fill="white" />
              <path d="M8 14C8 14 9.5 16 12 16C14.5 16 16 14 16 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Hono</span>
          </a>

          <a
            href="https://orpc.unnoq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <svg className="size-16" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="7" height="7" rx="1" fill="#3B82F6" />
              <rect x="13" y="4" width="7" height="7" rx="1" fill="#8B5CF6" />
              <rect x="4" y="13" width="7" height="7" rx="1" fill="#8B5CF6" />
              <rect x="13" y="13" width="7" height="7" rx="1" fill="#3B82F6" />
            </svg>
            <span className="text-sm font-medium text-gray-700">oRPC</span>
          </a>

          <a
            href="https://tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <svg className="size-16" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 6C9.33 6 7.67 7.33 7 10C8 8.67 9.17 8.17 10.5 8.5C11.26 8.67 11.81 9.23 12.41 9.84C13.39 10.84 14.53 12 17 12C19.67 12 21.33 10.67 22 8C21 9.33 19.83 9.83 18.5 9.5C17.74 9.33 17.19 8.77 16.59 8.16C15.61 7.16 14.47 6 12 6ZM7 12C4.33 12 2.67 13.33 2 16C3 14.67 4.17 14.17 5.5 14.5C6.26 14.67 6.81 15.23 7.41 15.84C8.39 16.84 9.53 18 12 18C14.67 18 16.33 16.67 17 14C16 15.33 14.83 15.83 13.5 15.5C12.74 15.33 12.19 14.77 11.59 14.16C10.61 13.16 9.47 12 7 12Z" fill="#06B6D4" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Tailwind CSS</span>
          </a>
        </div>

        <div className="mt-12 flex gap-x-4">
          <a
            href="https://github.com"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            View Docs
          </a>
          <a
            href="https://github.com"
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 transition-colors"
          >
            Examples
          </a>
        </div>
      </main>

      <footer className="mt-auto pt-16 pb-8 text-center text-sm text-gray-500">
        Built with modern web technologies
      </footer>
    </div>
  );
}

export default App;
