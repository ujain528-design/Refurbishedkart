"use client"
import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
export default function FlashSale({products=[]}){
  const [remaining,setRemaining]=useState(0)
  useEffect(()=>{ const end=Date.now()+24*60*60*1000; const id=setInterval(()=>{ setRemaining(Math.max(0,end-Date.now())) },1000); return ()=>clearInterval(id)},[])
  function fmt(ms){ const s=Math.floor(ms/1000)%60; const m=Math.floor(ms/60000)%60; const h=Math.floor(ms/3600000); return `${h}h ${m}m ${s}s` }
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Flash Sale</h2><div className="text-sm text-red-600">Ends in: {fmt(remaining)}</div></div>
      <div className="flex gap-4 overflow-x-auto mt-3 pb-4">{products.map(p=> <ProductCard key={p.id} product={p} />)}</div>
    </section>
  )
}
