import React, { useState, useEffect } from 'react'
import './InfoWidgets.css'

const IconCloud = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" /></svg>
const IconQuote = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></svg>
const IconPhone = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.12 6.12l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>

export const WeatherWidget = () => {
    const [data, setData] = useState(null)
    useEffect(() => {
        const fallback = () => fetch(`${import.meta.env.VITE_API_URL}/api/weather`).then(r => r.json()).then(setData).catch(() => { })
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (p) => fetch(`${import.meta.env.VITE_API_URL}/api/weather?lat=${p.coords.latitude}&lon=${p.coords.longitude}`).then(r => r.json()).then(setData).catch(fallback),
                fallback
            )
        } else { fallback() }
    }, [])
    if (!data?.temperature) return null
    const temp = parseFloat(data.temperature)
    const tempColor = temp > 32 ? 'var(--red-600)' : temp > 24 ? 'var(--amber-600)' : temp < 15 ? 'var(--teal-600)' : 'var(--slate-700)'
    return (
        <div className="widget-card">
            <div className="widget-label"><IconCloud />Weather</div>
            <div className="widget-row">
                <span className="widget-temp" style={{ color: tempColor }}>{data.temperature}°</span>
                <span className="widget-desc">{data.description}</span>
            </div>
            {data.mood_note && <p className="widget-note">{data.mood_note}</p>}
        </div>
    )
}

export const QuoteWidget = () => {
    const [quote, setQuote] = useState(null)
    useEffect(() => { fetch(`${import.meta.env.VITE_API_URL}/api/quote`).then(r => r.json()).then(setQuote).catch(() => { }) }, [])
    if (!quote) return null
    return (
        <div className="widget-card quote-card">
            <div className="widget-label"><IconQuote />Reflection</div>
            <p className="quote-text">"{quote.quote}"</p>
            <p className="quote-author">— {quote.author}</p>
        </div>
    )
}

export const HelplineWidget = () => {
    const [helpline, setHelpline] = useState(null)
    useEffect(() => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        let code = 'DEFAULT'
        if (/Calcutta|Kolkata/.test(tz)) code = 'IN'
        else if (/America\/(New_York|Chicago|Los_Angeles)/.test(tz)) code = 'US'
        else if (tz.includes('London')) code = 'GB'
        else if (/Canada|Toronto|Vancouver/.test(tz)) code = 'CA'
        else if (/Sydney|Melbourne/.test(tz)) code = 'AU'
        fetch(`${import.meta.env.VITE_API_URL}/api/helpline/${code}`).then(r => r.json()).then(setHelpline).catch(() => { })
    }, [])
    if (!helpline) return null
    return (
        <div className="widget-card helpline-card">
            <div className="helpline-label"><IconPhone />Crisis · {helpline.country}</div>
            <div className="helpline-number">{helpline.number}</div>
            <div className="helpline-name">{helpline.name}</div>
        </div>
    )
}
