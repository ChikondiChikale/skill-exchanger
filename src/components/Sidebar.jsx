const links = [
  { name: 'Overview', href: '#', active: true },
  { name: 'Skills', href: '#' },
  { name: 'Matches', href: '#' },
  { name: 'Messages', href: '#' },
  { name: 'Settings', href: '#' },
]

function Sidebar() {
  return (
    <aside className="w-64 border-r border-white/10 bg-[#062f2f] p-6 text-white">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white">Skill Exchanger</h2>
        <p className="text-sm text-gray-300">Dashboard</p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              link.active
                ? 'bg-amber-500 text-white'
                : 'text-gray-200 hover:bg-white/10 hover:text-amber-300'
            }`}
          >
            {link.name}
          </a>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
