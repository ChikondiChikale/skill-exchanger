function DashboardNavbar() {
  return (
    <header className="flex items-center justify-between border-b border-[#d9e7df] bg-[#fffdf2] px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-lg border border-[#9ac5b8] px-4 py-2 text-sm font-medium text-[#062f2f] hover:bg-white">
          Profile
        </button>
        <button className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
          New Session
        </button>
      </div>
    </header>
  )
}

export default DashboardNavbar
