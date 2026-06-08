export default function BulkEnquiry(){
  return (
    <section className="mt-8 p-6 bg-green-50 rounded flex items-center justify-between">
      <div>
        <div className="text-xl font-semibold">Need 5+ units? Get a custom quote.</div>
        <div className="text-sm text-gray-600">We can offer corporate pricing and delivery options.</div>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 border rounded">Fill a Form</button>
        <button className="px-4 py-2 bg-green-600 text-white rounded">Chat on WhatsApp</button>
      </div>
    </section>
  )
}
