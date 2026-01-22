'use client'

import React, { useState, useEffect } from 'react'

const CountdownTimer = ({ hours = 1, minutes = 37, seconds = 27 }) => {
  const [time, setTime] = useState({ hours, minutes, seconds })

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let newSeconds = prev.seconds - 1
        let newMinutes = prev.minutes
        let newHours = prev.hours

        if (newSeconds < 0) {
          newSeconds = 59
          newMinutes -= 1
        }

        if (newMinutes < 0) {
          newMinutes = 59
          newHours -= 1
        }

        if (newHours < 0) {
          return { hours: 23, minutes: 59, seconds: 59 }
        }

        return { hours: newHours, minutes: newMinutes, seconds: newSeconds }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (value) => {
    return value.toString().padStart(2, '0')
  }

  return (
    <div className="flex items-center gap-2">
      <div className="bg-orange-500 text-white px-3 py-1.5 rounded font-bold text-sm">
        {formatTime(time.hours)}
      </div>
      <span className="text-white text-sm">h</span>
      <span className="text-white/50">:</span>
      <div className="bg-orange-500 text-white px-3 py-1.5 rounded font-bold text-sm">
        {formatTime(time.minutes)}
      </div>
      <span className="text-white text-sm">m</span>
      <span className="text-white/50">:</span>
      <div className="bg-orange-500 text-white px-3 py-1.5 rounded font-bold text-sm">
        {formatTime(time.seconds)}
      </div>
      <span className="text-white text-sm">s</span>
    </div>
  )
}

export default CountdownTimer

