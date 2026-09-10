import { Link } from 'react-router-dom'

const links = [
  { name: 'Overview', href: '/dashboard', active: true },
  { name: 'Discover', href: '/discover' },
  { name: 'Skills', href: '/skills' },
  { name: 'Messages', href: '/messages' },
  { name: 'Exchange Requests', href: '/exchange-requests' },
  { name: 'Settings', href: '/settings' },
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
          <Link
            key={link.name}
            to={link.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
              link.active
                ? 'bg-amber-500 text-white'
                : 'text-gray-200 hover:bg-white/10 hover:text-amber-300'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
