export default function TrustBadges(){
  const badges=['Tested & Certified','7-Day Returns','GST Invoice','PAN India Delivery']
  return (
    <div className="max-w-7xl mx-auto px-4 mt-4">
      <div className="flex gap-6 justify-center text-sm text-gray-700">
        {badges.map(b=> <div key={b} className="px-3 py-2 bg-gray-50 rounded">{b}</div>)}
      </div>
    </div>
  )
}
