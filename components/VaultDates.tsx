'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/app/utils/helper';

export function VaultDates({ start, end }: { start: string, end: string }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <p className="text-sm text-gray-600 dark:text-gray-400">
            {formatDate(start)} - {formatDate(end)}
        </p>
    )
}


export function PositionDate({ createdAt }: { createdAt: string }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
            Created: {formatDate(createdAt)}
        </p>
    )
}
